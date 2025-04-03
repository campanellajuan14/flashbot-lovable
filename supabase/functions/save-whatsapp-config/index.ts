
// Supabase Edge Function: save-whatsapp-config
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Función para verificar el token de API con WhatsApp
async function verifyWhatsAppToken(phoneNumberId: string, token: string): Promise<boolean> {
  try {
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
      console.error("Error verificando token de WhatsApp:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error en verificación de token:", error);
    return false;
  }
}

serve(async (req) => {
  // Manejar preflight CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }
  
  try {
    // Crear cliente de Supabase con rol de servicio para acceder a Vault
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
    
    // Verificar la autenticación del usuario
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Crear cliente de Supabase con el token JWT del usuario
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
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
      }
    );
    
    // Obtener el usuario actual desde el token JWT
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Extraer datos del cuerpo de la solicitud
    const { phone_number_id, waba_id, api_token } = await req.json();
    
    // Validar datos obligatorios
    if (!phone_number_id || !waba_id || !api_token) {
      return new Response(
        JSON.stringify({ error: 'Faltan datos obligatorios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Verificar el token con la API de WhatsApp
    const isTokenValid = await verifyWhatsAppToken(phone_number_id, api_token);
    if (!isTokenValid) {
      return new Response(
        JSON.stringify({ error: 'Token de API de WhatsApp inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Almacenar token en Vault
    const { data: secretData, error: secretError } = await supabaseAdmin.vault.encrypt(api_token);
    
    if (secretError) {
      console.error("Error guardando token en Vault:", secretError);
      return new Response(
        JSON.stringify({ error: 'Error al guardar el token seguro' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Verificar si ya existe una configuración para este usuario
    const { data: existingConfig, error: configError } = await supabaseClient
      .from('user_whatsapp_config')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
      
    if (configError && configError.code !== 'PGRST116') { // PGRST116 es "no rows returned"
      console.error("Error al verificar configuración existente:", configError);
      return new Response(
        JSON.stringify({ error: 'Error al verificar configuración existente' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Datos de configuración a guardar
    const configData = {
      user_id: user.id,
      phone_number_id,
      waba_id,
      secret_id: secretData.id,
      // No modificamos estos campos si ya existían
      is_active: existingConfig?.is_active ?? false,
      webhook_verified: existingConfig?.webhook_verified ?? false,
      webhook_verify_token: existingConfig?.webhook_verify_token || undefined,
      active_chatbot_id: existingConfig?.active_chatbot_id || null
    };
    
    let result;
    
    if (existingConfig) {
      // Actualizar configuración existente
      result = await supabaseClient
        .from('user_whatsapp_config')
        .update(configData)
        .eq('user_id', user.id)
        .select('*')
        .maybeSingle();
    } else {
      // Crear nueva configuración
      result = await supabaseClient
        .from('user_whatsapp_config')
        .insert(configData)
        .select('*')
        .maybeSingle();
    }
    
    if (result.error) {
      console.error("Error al guardar configuración:", result.error);
      return new Response(
        JSON.stringify({ error: 'Error al guardar configuración' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Devolver respuesta exitosa
    return new Response(
      JSON.stringify({
        success: true,
        message: existingConfig ? 'Configuración actualizada' : 'Configuración guardada',
        config: result.data
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error("Error inesperado:", error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
