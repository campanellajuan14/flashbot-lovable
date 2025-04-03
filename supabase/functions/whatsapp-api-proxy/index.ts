
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface WhatsAppMessage {
  recipient_type: string;
  to: string;
  type: string;
  text?: {
    body: string;
  };
  template?: {
    name: string;
    language: {
      code: string;
    };
  };
}

interface ProxyRequest {
  action: string;
  phone_number_id?: string;
  recipient_phone?: string;
  message_content?: string;
  message_type?: 'text' | 'template';
  template_name?: string;
  template_lang?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  console.log("Starting whatsapp-api-proxy function");

  try {
    // Set up Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    // User authenticated client
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } },
    });

    // Admin client for vault access
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("Authentication error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized. Please sign in." }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get request data
    const requestData = await req.json() as ProxyRequest;
    console.log("Request data received:", JSON.stringify(requestData));

    // Validate requested action
    if (!requestData.action) {
      return new Response(
        JSON.stringify({ error: "An action must be specified" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's WhatsApp configuration
    const { data: configData, error: configError } = await supabase
      .from('user_whatsapp_config')
      .select('phone_number_id, secret_id')
      .eq('user_id', user.id)
      .single();

    if (configError || !configData) {
      console.error("Error getting configuration:", configError);
      return new Response(
        JSON.stringify({ error: "No WhatsApp configuration found for this user" }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get API token from Vault
    const { data: secretData, error: secretError } = await supabaseAdmin.vault.decrypt(configData.secret_id);
    
    if (secretError) {
      console.error("Error getting token from Vault:", secretError);
      return new Response(
        JSON.stringify({ error: "Error retrieving secure credentials", details: secretError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use specific phone_number_id or default from user config
    const phoneNumberId = requestData.phone_number_id || configData.phone_number_id;
    const apiToken = secretData.secret;

    // Process different actions
    switch (requestData.action) {
      case 'send_message':
        return await handleSendMessage(
          phoneNumberId, 
          apiToken, 
          requestData, 
          user.id,
          corsHeaders,
          supabaseAdmin
        );
      
      case 'get_business_profile':
        return await handleGetProfile(phoneNumberId, apiToken, corsHeaders);
      
      case 'get_phone_numbers':
        return await handleGetPhoneNumbers(apiToken, corsHeaders);
      
      default:
        return new Response(
          JSON.stringify({ error: `Unsupported action: ${requestData.action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleSendMessage(
  phoneNumberId: string, 
  apiToken: string, 
  requestData: ProxyRequest,
  userId: string,
  corsHeaders: Record<string, string>,
  supabaseAdmin: any
) {
  // Validate required parameters
  if (!requestData.recipient_phone || !requestData.message_content) {
    return new Response(
      JSON.stringify({ error: "recipient_phone and message_content are required to send a message" }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Format phone number (ensure it starts with country code)
  const recipientPhone = formatPhoneNumber(requestData.recipient_phone);

  // Build message according to type
  let messageBody: WhatsAppMessage = {
    recipient_type: "individual",
    to: recipientPhone,
    type: requestData.message_type || "text"
  };

  if (messageBody.type === "text") {
    messageBody.text = {
      body: requestData.message_content
    };
  } else if (messageBody.type === "template") {
    messageBody.template = {
      name: requestData.template_name || "hello_world",
      language: {
        code: requestData.template_lang || "es"
      }
    };
  }

  try {
    // Call WhatsApp API to send message
    console.log(`Sending message to ${recipientPhone} via WhatsApp API`);
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, 
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(messageBody)
      }
    );

    const responseData = await response.json();
    console.log("WhatsApp API response:", JSON.stringify(responseData));

    // Log sent message
    if (response.ok) {
      try {
        await supabaseAdmin
          .from('whatsapp_messages')
          .insert({
            user_id: userId,
            phone_number_id: phoneNumberId,
            wa_message_id: responseData.messages?.[0]?.id,
            from_number: phoneNumberId,
            to_number: recipientPhone,
            message_type: messageBody.type,
            message_content: requestData.message_content,
            direction: 'outbound',
            status: 'sent',
            metadata: responseData
          });
        console.log("Message logged successfully");
      } catch (logError) {
        console.error("Error logging sent message:", logError);
        // Continue despite logging error
      }
    }

    if (!response.ok) {
      console.error("Error sending WhatsApp message:", responseData);
      return new Response(
        JSON.stringify({ error: "Error sending message", details: responseData }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: responseData }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error sending message:", error);
    return new Response(
      JSON.stringify({ error: "Error communicating with WhatsApp API", details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleGetProfile(
  phoneNumberId: string, 
  apiToken: string, 
  corsHeaders: Record<string, string>
) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/whatsapp_business_profile`, 
      {
        headers: {
          "Authorization": `Bearer ${apiToken}`,
          "Content-Type": "application/json"
        }
      }
    );

    const responseData = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: "Error getting business profile", details: responseData }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: responseData }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Error communicating with WhatsApp API", details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleGetPhoneNumbers(
  apiToken: string, 
  corsHeaders: Record<string, string>
) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/phone_numbers`, 
      {
        headers: {
          "Authorization": `Bearer ${apiToken}`,
          "Content-Type": "application/json"
        }
      }
    );

    const responseData = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: "Error getting phone numbers", details: responseData }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: responseData }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Error communicating with WhatsApp API", details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

function formatPhoneNumber(phone: string): string {
  // Remove spaces, hyphens, and parentheses
  let cleaned = phone.replace(/[\s\-()]/g, '');
  
  // Ensure it starts with +
  if (!cleaned.startsWith('+')) {
    // If starts with 521 (Mexico mobile) or 52 (Mexico fixed), add +
    if (cleaned.startsWith('521') || cleaned.startsWith('52')) {
      cleaned = '+' + cleaned;
    } else {
      // Default to Mexico if no country code
      cleaned = '+52' + cleaned;
    }
  }
  
  return cleaned;
}
