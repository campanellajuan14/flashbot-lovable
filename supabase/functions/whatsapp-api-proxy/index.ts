
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
    // Segundo método: intentar obtener de user_whatsapp_tokens (más directo y confiable)
    try {
      console.log("🔍 Intentando obtener token desde tabla user_whatsapp_tokens");
      const { data: tokenData, error: tokenError } = await supabaseAdmin
        .from('user_whatsapp_tokens')
        .select('encrypted_token, created_at')
        .eq('id', secretId)
        .single();
        
      if (tokenError) {
        console.error("❌ Error consultando tabla user_whatsapp_tokens:", tokenError);
      } else if (tokenData && tokenData.encrypted_token) {
        // Log del token parcial para diagnóstico (solo prefijo)
        console.log(`✅ Token recuperado desde user_whatsapp_tokens: ${tokenData.encrypted_token.substring(0, 10)}...`);
        console.log(`📅 Token creado/actualizado: ${tokenData.created_at || 'fecha desconocida'}`);
        return tokenData.encrypted_token;
      } else {
        console.log("ℹ️ No se encontró token en user_whatsapp_tokens, verificando backups");
      }
    } catch (dbError) {
      console.error("❌ Error de base de datos:", dbError);
    }
    
    // Tercer método: verificar campo secret_data en user_whatsapp_config (respaldo)
    try {
      console.log("🔍 Intentando obtener token desde secret_data en user_whatsapp_config");
      const { data: configData, error: configError } = await supabaseAdmin
        .from('user_whatsapp_config')
        .select('secret_data, updated_at')
        .eq('secret_id', secretId)
        .single();
        
      if (configError) {
        console.error("❌ Error consultando secret_data:", configError);
      } else if (configData && configData.secret_data) {
        console.log(`✅ Token recuperado desde secret_data: ${configData.secret_data.substring(0, 10)}...`);
        console.log(`📅 Token actualizado: ${configData.updated_at || 'fecha desconocida'}`);
        return configData.secret_data;
      } else {
        console.log("ℹ️ No se encontró token en secret_data");
      }
    } catch (fallbackError) {
      console.error("❌ Error en método fallback:", fallbackError);
    }
    
    // Primer método: intentar usar Vault (menos confiable, usar como último recurso)
    try {
      if (supabaseAdmin.vault && typeof supabaseAdmin.vault.decrypt === 'function') {
        console.log("🗄️ Intentando obtener token desde Vault como último recurso");
        const { data, error } = await supabaseAdmin.vault.decrypt(secretId);
        
        if (error) {
          console.error("❌ Error desencriptando token desde Vault:", error.message);
        } else if (data) {
          console.log(`✅ Token recuperado desde Vault: ${data.substring(0, 10)}...`);
          return data;
        }
      } else {
        console.log("ℹ️ Vault no disponible");
      }
    } catch (vaultError) {
      console.error("❌ Error accediendo a Vault:", vaultError);
    }
    
    // Diagnóstico adicional para depuración
    try {
      console.log("🔍 Ejecutando diagnóstico adicional");
      
      const { data: configInfo, error: configError } = await supabaseAdmin
        .from('user_whatsapp_config')
        .select('id, phone_number_id, waba_id, is_active, webhook_verified')
        .eq('secret_id', secretId)
        .single();
        
      if (configError) {
        console.error("❌ Error obteniendo configuración:", configError);
      } else if (configInfo) {
        console.log("📋 Información de configuración encontrada:", {
          configId: configInfo.id,
          phoneNumberId: configInfo.phone_number_id,
          wabaId: configInfo.waba_id,
          isActive: configInfo.is_active,
          webhookVerified: configInfo.webhook_verified
        });
      }
      
      // Verificar si hay algún token disponible para este usuario
      const { data: anyTokens, error: anyTokensError } = await supabaseAdmin
        .from('user_whatsapp_tokens')
        .select('id, created_at, updated_at')
        .eq('user_id', userId)
        .limit(5);
        
      if (anyTokensError) {
        console.error("❌ Error buscando tokens:", anyTokensError);
      } else if (anyTokens && anyTokens.length > 0) {
        console.log(`🔑 Encontrados ${anyTokens.length} tokens para el usuario:`, anyTokens);
      } else {
        console.log("⚠️ No se encontraron tokens para este usuario");
      }
      
    } catch (diagError) {
      console.error("❌ Error en diagnóstico:", diagError);
    }
    
    // Si llegamos aquí, todos los métodos fallaron
    throw new Error(
      "No se pudo recuperar el token de WhatsApp. " +
      "Es posible que el token no esté correctamente configurado o que haya expirado. " +
      "Por favor, actualiza el token en la configuración de WhatsApp."
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
    console.log(`✅ Token de WhatsApp recuperado correctamente (primeros caracteres: ${whatsappToken.substring(0, 5)}...)`);
    
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
    
    const apiVersion = "v18.0"; // Usar una versión estable de la API
    const whatsappApiUrl = `https://graph.facebook.com/${apiVersion}/${config.phone_number_id}/${action}`;
    console.log(`🌐 URL API de WhatsApp: ${whatsappApiUrl}`);
    
    try {
      // Registrar la solicitud exacta que se envía a WhatsApp para diagnóstico
      console.log("📨 Enviando solicitud a WhatsApp API con payload:", JSON.stringify(params));
      
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
        
        // Registrar información detallada de la solicitud fallida para depuración
        console.error("📋 Detalles de la solicitud fallida:", { 
          url: whatsappApiUrl,
          status: whatsappResponse.status,
          statusText: whatsappResponse.statusText,
          headers: Object.fromEntries(whatsappResponse.headers.entries()),
          errorText
        });
        
        // Para errores 401/403, es muy probable que sea un problema de token
        if (whatsappResponse.status === 401 || whatsappResponse.status === 403) {
          throw new Error(
            "Token de WhatsApp inválido o expirado. " +
            "Por favor, actualiza el token en la configuración de WhatsApp Business."
          );
        }
        
        try {
          const errorJson = JSON.parse(errorText);
          
          // Procesamiento especial para errores comunes de la API de WhatsApp
          if (errorJson.error) {
            if (errorJson.error.code === 100 || errorJson.error.code === 190) {
              throw new Error(
                "Token de WhatsApp inválido o con permisos insuficientes. " +
                "Verifica que el token tenga los permisos necesarios y que esté vigente."
              );
            } else if (errorJson.error.code === 132000) {
              throw new Error(
                "Número de teléfono inválido o con formato incorrecto. " +
                "Asegúrate de incluir el código de país completo (ej: +34612345678)."
              );
            } else if (errorJson.error.message && errorJson.error.message.includes("template")) {
              throw new Error(
                "Error con la plantilla: " + errorJson.error.message + ". " +
                "Verifica que la plantilla exista y esté aprobada en tu cuenta de WhatsApp Business."
              );
            }
            
            throw new Error(`Error de WhatsApp API: ${errorJson.error.message || JSON.stringify(errorJson.error)}`);
          }
          
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
    const statusCode = errorMessage.includes('inválido o expirado') || errorMessage.includes('token') ? 401 
                    : errorMessage.includes('Unauthorized') ? 401 
                    : 500;
    
    // Clasificar el tipo de error para mejor diagnóstico del cliente
    const errorType = 
      errorMessage.includes('token') || errorMessage.includes('Token') ? 'token_error' :
      errorMessage.includes('template') ? 'template_error' :
      errorMessage.includes('teléfono') || errorMessage.includes('phone') ? 'phone_number_error' :
      errorMessage.includes('configuración') || errorMessage.includes('config') ? 'config_error' :
      'general_error';
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        code: statusCode,
        type: errorType,
        details: error.stack
      }),
      { 
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
