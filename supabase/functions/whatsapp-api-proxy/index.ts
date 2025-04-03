
// Supabase Edge Function: whatsapp-api-proxy
// Proxy seguro para llamadas a la API de WhatsApp
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHash } from "https://deno.land/std@0.168.0/node/crypto.ts";

// Configuración de CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// Función para desencriptar el token en caso de no usar Vault
function decryptToken(encryptedToken: string, secret: string): string {
  // Esta es una función simulada ya que no podemos realmente desencriptar un hash
  // En una implementación real, usaríamos encriptación bidireccional en lugar de un hash
  console.log("Advertencia: usando método provisional para manejar tokens");
  return encryptedToken;
}

// Función para recuperar el token de WhatsApp del usuario
async function getWhatsAppToken(supabaseAdmin, userId, secretId) {
  try {
    // Intentar usar Vault si está disponible
    if (supabaseAdmin.vault && typeof supabaseAdmin.vault.decrypt === 'function') {
      console.log("Usando Supabase Vault para recuperar el token");
      const { data, error } = await supabaseAdmin.vault.decrypt(secretId);
      
      if (error) {
        throw new Error(`Error decrypting token from Vault: ${error.message}`);
      }
      
      return data;
    }
    
    // Si Vault no está disponible, intentar recuperar de la tabla user_whatsapp_tokens
    console.log("Vault no disponible, intentando recuperar token de la tabla");
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('user_whatsapp_tokens')
      .select('encrypted_token')
      .match({ id: secretId, user_id: userId })
      .single();
      
    if (tokenError) {
      throw new Error(`Error retrieving token: ${tokenError.message}`);
    }
    
    // Desencriptar el token usando el método provisional
    return decryptToken(
      tokenData.encrypted_token,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
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
    
    // Recuperar token de WhatsApp
    const whatsappToken = await getWhatsAppToken(supabaseAdmin, user.id, config.secret_id);
    
    if (!whatsappToken) {
      throw new Error("Could not retrieve WhatsApp token");
    }
    
    // Construir y ejecutar la llamada a la API de WhatsApp
    const whatsappApiUrl = `https://graph.facebook.com/v18.0/${config.phone_number_id}/${action}`;
    
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
      throw new Error(`WhatsApp API error: ${JSON.stringify(responseData)}`);
    }
    
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
