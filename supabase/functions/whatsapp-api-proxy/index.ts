// Supabase Edge Function: whatsapp-api-proxy
// Proxy seguro para llamadas a la API de WhatsApp
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Configuración de CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// IMPROVED: More robust token retrieval function that tries multiple methods
async function getWhatsAppToken(supabaseAdmin, userId, secretId) {
  console.log(`Attempting to retrieve WhatsApp token for user ${userId}, secret ID: ${secretId}`);
  
  try {
    // Method 1: Try to get directly from user_whatsapp_tokens table
    try {
      console.log("Attempting to retrieve token from user_whatsapp_tokens table...");
      const { data: tokenData, error: tokenError } = await supabaseAdmin
        .from('user_whatsapp_tokens')
        .select('encrypted_token')
        .eq('id', secretId)
        .single();
        
      if (!tokenError && tokenData && tokenData.encrypted_token) {
        console.log("Successfully retrieved API token from user_whatsapp_tokens table");
        return tokenData.encrypted_token;
      } else {
        console.error("Error retrieving token from user_whatsapp_tokens table:", tokenError);
      }
    } catch (dbError) {
      console.error("Database access error:", dbError);
    }
    
    // Method 2: Fallback - try direct query from user_whatsapp_config table
    try {
      console.log("Attempting to retrieve token from secret_data in user_whatsapp_config...");
      const { data: configData, error: configError } = await supabaseAdmin
        .from('user_whatsapp_config')
        .select('secret_data')
        .eq('secret_id', secretId)
        .single();
        
      if (!configError && configData && configData.secret_data) {
        console.log("Successfully retrieved API token from user_whatsapp_config");
        return configData.secret_data;
      } else {
        console.error("Error retrieving token from user_whatsapp_config:", configError);
      }
    } catch (backupError) {
      console.error("Backup token retrieval error:", backupError);
    }
    
    // Method 3: Try Vault as last resort if available
    if (supabaseAdmin.vault && typeof supabaseAdmin.vault.decrypt === 'function') {
      try {
        console.log("Attempting to retrieve token from Vault...");
        const { data, error } = await supabaseAdmin.vault.decrypt(secretId);
        
        if (!error && data) {
          console.log("Successfully retrieved API token from Vault");
          return data;
        } else {
          console.error("Failed to retrieve token from Vault:", error);
        }
      } catch (vaultError) {
        console.error("Vault access error:", vaultError);
      }
    } else {
      console.log("Vault not available, skipping Vault token retrieval");
    }
    
    // All methods failed
    console.error("All token retrieval methods failed");
    throw new Error(
      "No se pudo recuperar el token de WhatsApp. " +
      "Verifica que el token se haya guardado correctamente en la configuración."
    );
    
  } catch (error) {
    console.error("Error retrieving WhatsApp token:", error);
    throw error;
  }
}

serve(async (req) => {
  // Manejar las solicitudes OPTIONS para CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }
  
  try {
    // Crear cliente de Supabase con service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Verificar autenticación del usuario
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error("Unauthorized - Missing auth header");
    }
    
    // Crear cliente de Supabase con el token JWT del usuario
    const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });
    
    // Obtener usuario autenticado
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized - Invalid user");
    }
    
    // Obtener configuración de WhatsApp del usuario
    const { data: config, error: configError } = await supabaseClient
      .from('user_whatsapp_config')
      .select('*')
      .eq('user_id', user.id)
      .single();
      
    if (configError || !config) {
      throw new Error("WhatsApp configuration not found");
    }
    
    // Verificar que WhatsApp esté activo
    if (!config.is_active) {
      throw new Error("WhatsApp integration is not active");
    }
    
    // Obtener datos de la solicitud
    const requestData = await req.json();
    const { action, params } = requestData;
    
    if (!action || !params) {
      throw new Error("Missing required fields: action or params");
    }
    
    // Recuperar token de WhatsApp usando la función mejorada
    const whatsappToken = await getWhatsAppToken(supabaseAdmin, user.id, config.secret_id);
    
    if (!whatsappToken) {
      throw new Error("Could not retrieve WhatsApp token");
    }
    
    console.log(`Successfully retrieved WhatsApp token for user ${user.id}`);
    console.log(`Making API call to WhatsApp: ${action}`);
    
    // Construir y ejecutar la llamada a la API de WhatsApp
    const whatsappApiUrl = `https://graph.facebook.com/v18.0/${config.phone_number_id}/${action}`;
    
    console.log(`Calling WhatsApp API at URL: ${whatsappApiUrl}`);
    console.log(`With params: ${JSON.stringify(params)}`);
    
    const whatsappResponse = await fetch(whatsappApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${whatsappToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params)
    });
    
    const responseData = await whatsappResponse.json();
    
    if (!whatsappResponse.ok) {
      console.error(`WhatsApp API error: ${JSON.stringify(responseData)}`);
      throw new Error(`WhatsApp API error: ${JSON.stringify(responseData)}`);
    }
    
    console.log(`WhatsApp API response: ${JSON.stringify(responseData)}`);
    
    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error("Error in whatsapp-api-proxy:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error'
      }),
      { 
        status: error.message.includes('Unauthorized') ? 401 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
