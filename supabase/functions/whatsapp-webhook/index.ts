
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"
import { corsHeaders } from "./utils/cors.ts"
import { verifySignature } from "./utils/signature.ts"
import { processIncomingMessage } from "./handlers/messageHandler.ts"
import { processMessageStatus } from "./handlers/statusHandler.ts"

serve(async (req: Request) => {
  // Get environment variables
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const metaAppSecret = Deno.env.get('META_APP_SECRET') || '';
  
  // Create Supabase client with service role
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  console.log("Starting whatsapp-webhook function");

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Handle webhook verification (GET request)
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const challenge = url.searchParams.get('hub.challenge');
    const verifyToken = url.searchParams.get('hub.verify_token');
    const phoneNumberId = url.searchParams.get('phone_number_id');

    console.log(`Verification request received: mode=${mode}, token=${verifyToken}, phone=${phoneNumberId}`);

    if (!phoneNumberId) {
      return new Response(
        JSON.stringify({ error: "phone_number_id parameter is required" }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Find WhatsApp configuration by phone_number_id
    const { data: configData, error: configError } = await supabase
      .from('user_whatsapp_config')
      .select('id, user_id, webhook_verify_token')
      .eq('phone_number_id', phoneNumberId)
      .single();

    if (configError || !configData) {
      console.error(`Error finding configuration for ${phoneNumberId}:`, configError);
      return new Response(
        JSON.stringify({ error: "No configuration found for this phone_number_id" }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Verify token
    if (mode === 'subscribe' && verifyToken === configData.webhook_verify_token) {
      console.log(`Verification successful for phone_number_id ${phoneNumberId}`);
      
      // Update verification status
      await supabase
        .from('user_whatsapp_config')
        .update({ webhook_verified: true })
        .eq('id', configData.id);

      // Respond with challenge to complete verification
      return new Response(challenge || '', 
        { status: 200, headers: { 'Content-Type': 'text/plain', ...corsHeaders } }
      );
    } else {
      console.error(`Verification failed: incorrect token for ${phoneNumberId}`);
      return new Response(
        JSON.stringify({ error: "Verification failed: incorrect token" }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
  }
  
  // Handle event notifications (POST request)
  else if (req.method === 'POST') {
    try {
      // Clone request to read body multiple times
      const reqClone = req.clone();
      const rawBody = await req.text();
      
      // Log the raw body for debugging
      console.log("Raw webhook payload received:", rawBody);
      
      // Verify Meta signature if APP_SECRET is configured
      if (metaAppSecret) {
        const signature = req.headers.get('x-hub-signature-256') || '';
        
        if (!signature) {
          console.warn("Request without signature (x-hub-signature-256)");
          // Continue processing even without signature for testing
        } else {
          // Verify signature
          const isValid = await verifySignature(rawBody, signature, metaAppSecret);
          
          if (!isValid) {
            console.error("Invalid signature. Possible unauthorized request.");
            return new Response(
              JSON.stringify({ error: "Invalid signature" }),
              { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
            );
          }
        }
      }

      const data = JSON.parse(rawBody);
      console.log("Webhook payload received:", JSON.stringify(data));
      
      // Verify it's a WhatsApp notification
      if (data.object !== 'whatsapp_business_account') {
        return new Response(
          JSON.stringify({ error: "Unsupported event type" }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Process each entry
      for (const entry of data.entry) {
        for (const change of entry.changes) {
          if (change.field === 'messages') {
            const value = change.value;
            const phoneNumberId = value.metadata?.phone_number_id;
            
            if (!phoneNumberId) {
              console.error("Missing phone_number_id in webhook payload");
              continue;
            }
            
            // Process incoming messages
            if (value.messages && value.messages.length > 0) {
              for (const message of value.messages) {
                console.log(`Processing message: ${JSON.stringify(message)}`);
                
                // Only process text messages for now
                if (message.type === 'text' && message.text) {
                  await processIncomingMessage(
                    supabase, 
                    phoneNumberId,
                    message,
                    value.contacts?.find(c => c.wa_id === message.from)?.profile?.name || 'Usuario'
                  );
                } else {
                  console.log(`Skipping non-text message of type: ${message.type}`);
                }
              }
            }
            
            // Process message status updates
            if (value.statuses && value.statuses.length > 0) {
              for (const status of value.statuses) {
                await processMessageStatus(supabase, phoneNumberId, status);
              }
            }
          }
        }
      }

      // Respond quickly to avoid retries
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    } catch (error) {
      console.error("Error processing webhook:", error);
      return new Response(
        JSON.stringify({ error: "Error processing payload", details: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
  } else {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
