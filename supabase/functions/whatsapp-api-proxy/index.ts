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

// Función para recuperar el token de WhatsApp del usuario
async function getWhatsAppToken(supabaseAdmin, userId, secretId) {
  console.log(`⚙️ Intentando obtener token WhatsApp para usuario ${userId}, secretId: ${secretId}`);
  
  try {
    // Primer método: intentar usar Vault
    try {
      if (supabaseAdmin.vault && typeof supabaseAdmin.vault.decrypt === 'function') {
        console.log("🗄️ Intentando obtener token desde Vault");
        const { data, error } = await supabaseAdmin.vault.decrypt(secretId);
        
        if (error) {
          console.error("❌ Error desencriptando token desde Vault:", error.message);
        } else if (data) {
          console.log("✅ Token recuperado exitosamente desde Vault");
          return data;
        }
      } else {
        console.log("ℹ️ Vault no disponible, intentando otros métodos");
      }
    } catch (vaultError) {
      console.error("❌ Error accediendo a Vault:", vaultError);
    }
    
    // Segundo método: intentar obtener de user_whatsapp_tokens
    try {
      console.log("🔍 Intentando obtener token desde tabla user_whatsapp_tokens");
      const { data: tokenData, error: tokenError } = await supabaseAdmin
        .from('user_whatsapp_tokens')
        .select('encrypted_token')
        .eq('id', secretId)
        .single();
        
      if (tokenError) {
        console.error("❌ Error consultando tabla user_whatsapp_tokens:", tokenError);
      } else if (tokenData && tokenData.encrypted_token) {
        console.log("✅ Token recuperado exitosamente desde user_whatsapp_tokens");
        
        // Validar el token antes de devolverlo
        try {
          const validationResponse = await fetch('https://graph.facebook.com/v18.0/debug_token', {
            headers: {
              'Authorization': `Bearer ${tokenData.encrypted_token}`,
            }
          });
          
          if (!validationResponse.ok) {
            console.error("❌ Token inválido o expirado");
            throw new Error("Token inválido o expirado. Por favor, actualiza el token en la configuración.");
          }
          
          return tokenData.encrypted_token;
        } catch (validationError) {
          console.error("❌ Error validando token:", validationError);
          throw new Error("Error validando token de WhatsApp");
        }
      }
    } catch (dbError) {
      console.error("❌ Error de base de datos:", dbError);
    }
    
    // Tercer método: verificar campo secret_data en user_whatsapp_config
    try {
      console.log("🔍 Intentando obtener token desde secret_data en user_whatsapp_config");
      const { data: configData, error: configError } = await supabaseAdmin
        .from('user_whatsapp_config')
        .select('secret_data')
        .eq('user_id', userId)
        .eq('secret_id', secretId)
        .single();
        
      if (configError) {
        console.error("❌ Error consultando secret_data:", configError);
      } else if (configData && configData.secret_data) {
        console.log("✅ Token recuperado exitosamente desde secret_data");
        return configData.secret_data;
      }
    } catch (fallbackError) {
      console.error("❌ Error en método fallback:", fallbackError);
    }
    
    // Si llegamos aquí, todos los métodos fallaron
    throw new Error(
      "No se pudo recuperar el token de WhatsApp usando ningún método. " +
      "Verifica la configuración del token en el panel de WhatsApp."
    );
    
  } catch (error) {
    console.error("❌ Error general recuperando token de WhatsApp:", error);
    throw error;
  }
}

serve(async (req) => {
  console.log(`📥 Recibida solicitud ${req.method} a whatsapp-api-proxy`);
  
  // Manejar las solicitudes OPTIONS para CORS
  if (req.method === "OPTIONS") {
    console.log("✅ Respondiendo a solicitud OPTIONS (CORS)");
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
    let userId = null;
    let config = null;
    
    // Obtener datos de la solicitud
    let requestBody;
    try {
      requestBody = await req.json();
      console.log("📦 Payload recibido:", JSON.stringify(requestBody));
    } catch (parseError) {
      console.error("❌ Error al parsear body:", parseError);
      throw new Error("Invalid request body: " + parseError.message);
    }
    
    const { action, params, phone_number_id } = requestBody;
    
    if (!action) {
      throw new Error("Missing required field: action");
    }
    
    if (authHeader) {
      console.log("🔐 Autenticación JWT detectada, verificando usuario");
      
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
      const { data: userData, error: userError } = await supabaseClient.auth.getUser();
      if (userError || !userData?.user) {
        console.error("❌ Error autenticando usuario:", userError);
        throw new Error("Unauthorized - Invalid user");
      }
      
      userId = userData.user.id;
      console.log(`✅ Usuario autenticado: ${userId}`);
      
      // Obtener configuración de WhatsApp del usuario
      const { data: userConfig, error: configError } = await supabaseClient
        .from('user_whatsapp_config')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (configError) {
        console.error("❌ Error obteniendo configuración WhatsApp:", configError);
        throw new Error("WhatsApp configuration not found");
      }
      
      if (!userConfig) {
        throw new Error("No WhatsApp configuration found for this user");
      }
      
      // Verificar que WhatsApp esté activo
      if (!userConfig.is_active) {
        throw new Error("WhatsApp integration is not active");
      }
      
      config = userConfig;
      console.log(`✅ Configuración WhatsApp obtenida para phone_number_id: ${config.phone_number_id}`);
    } else if (phone_number_id) {
      // Modo alternativo: usar phone_number_id directamente
      console.log(`🔍 Buscando configuración por phone_number_id: ${phone_number_id}`);
      
      const { data: phoneConfig, error: phoneConfigError } = await supabaseAdmin
        .from('user_whatsapp_config')
        .select('*')
        .eq('phone_number_id', phone_number_id)
        .single();
        
      if (phoneConfigError || !phoneConfig) {
        console.error("❌ Error obteniendo configuración por phone_number_id:", phoneConfigError);
        throw new Error(`WhatsApp configuration not found for phone_number_id: ${phone_number_id}`);
      }
      
      config = phoneConfig;
      userId = config.user_id;
      console.log(`✅ Configuración encontrada para phone_number_id: ${phone_number_id}, usuario: ${userId}`);
    } else {
      throw new Error("Unauthorized - Missing auth header or phone_number_id");
    }
    
    // Verificar que existe configuración
    if (!config || !config.secret_id) {
      throw new Error("Invalid WhatsApp configuration: missing secret_id");
    }
    
    // Recuperar token de WhatsApp
    const whatsappToken = await getWhatsAppToken(supabaseAdmin, userId, config.secret_id);
    
    if (!whatsappToken) {
      throw new Error("Could not retrieve WhatsApp token");
    }
    console.log(`✅ Token de WhatsApp recuperado y validado correctamente`);
    
    // Tratamiento especial para recuperar plantillas (GET en lugar de POST)
    if (action === 'message_templates') {
      console.log("🔍 Obteniendo plantillas de WhatsApp");
      
      // Construir URL con los parámetros de consulta si existen
      const templateUrl = `https://graph.facebook.com/v18.0/${config.phone_number_id}/message_templates${
        params ? `?${new URLSearchParams(params)}` : ''
      }`;
      
      console.log("🌐 URL para plantillas:", templateUrl);
      
      try {
        const templatesResponse = await fetch(templateUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${whatsappToken}`,
            'Content-Type': 'application/json',
          }
        });
        
        if (!templatesResponse.ok) {
          const errorText = await templatesResponse.text();
          console.error(`❌ Error HTTP ${templatesResponse.status} obteniendo plantillas:`, errorText);
          
          // Manejar específicamente error de token inválido
          if (templatesResponse.status === 401) {
            throw new Error("Token de WhatsApp inválido o expirado. Por favor, actualiza el token en la configuración.");
          }
          
          try {
            const errorJson = JSON.parse(errorText);
            throw new Error(`WhatsApp API error (${templatesResponse.status}): ${JSON.stringify(errorJson)}`);
          } catch (jsonError) {
            throw new Error(`WhatsApp API error (${templatesResponse.status}): ${errorText}`);
          }
        }
        
        const templatesData = await templatesResponse.json();
        console.log(`✅ Plantillas obtenidas con éxito: ${templatesData.data?.length || 0} plantillas`);
        
        return new Response(JSON.stringify(templatesData), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (templateError) {
        console.error("❌ Error obteniendo plantillas:", templateError);
        throw templateError;
      }
    }
    
    // Proceder con el método POST para otras acciones
    if (!params) {
      throw new Error("Missing required field: params");
    }
    
    const whatsappApiUrl = `https://graph.facebook.com/v18.0/${config.phone_number_id}/${action}`;
    console.log(`🌐 URL API de WhatsApp: ${whatsappApiUrl}`);
    
    try {
      const whatsappResponse = await fetch(whatsappApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${whatsappToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params)
      });
      
      if (!whatsappResponse.ok) {
        const errorText = await whatsappResponse.text();
        console.error(`❌ Error HTTP ${whatsappResponse.status} en API WhatsApp:`, errorText);
        
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(`WhatsApp API error (${whatsappResponse.status}): ${JSON.stringify(errorJson)}`);
        } catch (jsonError) {
          throw new Error(`WhatsApp API error (${whatsappResponse.status}): ${errorText}`);
        }
      }
      
      const responseData = await whatsappResponse.json();
      console.log("✅ Respuesta exitosa de API WhatsApp:", JSON.stringify(responseData));
      
      return new Response(JSON.stringify(responseData), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (apiError) {
      console.error("❌ Error llamando a la API de WhatsApp:", apiError);
      throw apiError;
    }
    
  } catch (error) {
    console.error("❌ Error en whatsapp-api-proxy:", error);
    
    // Mejorar mensajes de error para el usuario
    const errorMessage = error.message || 'Internal server error';
    const statusCode = errorMessage.includes('inválido o expirado') ? 401 
                    : errorMessage.includes('Unauthorized') ? 401 
                    : 500;
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        code: statusCode,
        details: error.stack
      }),
      { 
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
