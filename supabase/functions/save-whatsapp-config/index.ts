
// Supabase Edge Function: save-whatsapp-config
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Improved CORS configuration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// Function to verify WhatsApp API token
async function verifyWhatsAppToken(phoneNumberId: string, token: string): Promise<boolean> {
  try {
    console.log(`Verificando token para phone_number_id: ${phoneNumberId}`);
    
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("Error verifying WhatsApp token:", error);
      return false;
    }
    
    console.log("Token verificado con éxito");
    return true;
  } catch (error) {
    console.error("Error in token verification:", error);
    return false;
  }
}

serve(async (req) => {
  // Handle preflight CORS requests
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }
  
  console.log("Starting save-whatsapp-config function");
  
  try {
    // Create Supabase client with service role for Vault access
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase environment variables");
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    
    console.log("Created Supabase Admin client");
    
    // Verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("Missing Authorization header");
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Create Supabase client with user's JWT token
    const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });
    
    console.log("Created Supabase User client");
    
    // Get authenticated user from JWT token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.error("Error getting user:", userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log("Authenticated user:", user.id);
    
    // Parse request data
    let requestData;
    try {
      requestData = await req.json();
      console.log("Received data:", JSON.stringify({
        phone_number_id: requestData.phone_number_id,
        waba_id: requestData.waba_id,
        api_token_length: requestData.api_token ? requestData.api_token.length : 0
      }));
    } catch (e) {
      console.error("JSON parse error:", e);
      return new Response(
        JSON.stringify({ error: 'Invalid request format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { phone_number_id, waba_id, api_token } = requestData;
    
    // Validate required data
    if (!phone_number_id || !waba_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: phone_number_id or waba_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check for existing configuration
    const { data: existingConfig, error: configError } = await supabaseClient
      .from('user_whatsapp_config')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
      
    if (configError && configError.code !== 'PGRST116') { // PGRST116 = "no rows returned"
      console.error("Error checking existing configuration:", configError);
      return new Response(
        JSON.stringify({ error: 'Error checking existing configuration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let secretId = existingConfig?.secret_id;
    
    // Handle API token validation and storage
    if (api_token) {
      console.log("Verifying API token...");
      const isTokenValid = await verifyWhatsAppToken(phone_number_id, api_token);
      if (!isTokenValid) {
        return new Response(
          JSON.stringify({ error: 'Invalid WhatsApp API token' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log("Storing token in Vault...");
      // Store token in Vault
      const { data: secretData, error: secretError } = await supabaseAdmin.vault.encrypt(api_token);
      
      if (secretError) {
        console.error("Error storing token in Vault:", secretError);
        return new Response(
          JSON.stringify({ error: 'Error storing secure token' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      secretId = secretData.id;
    } else if (!existingConfig?.secret_id) {
      // Require token if none exists
      return new Response(
        JSON.stringify({ error: 'API token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Prepare configuration data
    const configData = {
      user_id: user.id,
      phone_number_id,
      waba_id,
      secret_id: secretId,
      // No modificamos estos campos si ya existían
      is_active: existingConfig?.is_active ?? false,
      webhook_verified: existingConfig?.webhook_verified ?? false,
      webhook_verify_token: existingConfig?.webhook_verify_token || undefined,
      active_chatbot_id: existingConfig?.active_chatbot_id || null
    };
    
    let result;
    
    console.log("Saving configuration to database...");
    
    if (existingConfig) {
      // Update existing configuration
      result = await supabaseClient
        .from('user_whatsapp_config')
        .update(configData)
        .eq('user_id', user.id)
        .select('*')
        .maybeSingle();
    } else {
      // Create new configuration
      result = await supabaseClient
        .from('user_whatsapp_config')
        .insert(configData)
        .select('*')
        .maybeSingle();
    }
    
    if (result.error) {
      console.error("Error saving configuration:", result.error);
      return new Response(
        JSON.stringify({ error: 'Error saving configuration to database' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log("Configuration saved successfully");
    
    // Return successful response
    return new Response(
      JSON.stringify({
        success: true,
        message: existingConfig ? 'Configuration updated' : 'Configuration saved',
        config: result.data
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
