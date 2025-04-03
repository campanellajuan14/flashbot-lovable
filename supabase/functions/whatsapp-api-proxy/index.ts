
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

  try {
    // Configurar clientes de Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

    // Cliente con autenticación de usuario
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } },
    })

    // Cliente con rol de servicio para acceder al vault
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    // Verificar autenticación del usuario
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error("Error de autenticación:", authError)
      return new Response(
        JSON.stringify({ error: "No autorizado. Debe iniciar sesión." }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Obtener datos del cuerpo de la petición
    const requestData = await req.json() as ProxyRequest

    // Validar acción solicitada
    if (!requestData.action) {
      return new Response(
        JSON.stringify({ error: "Se debe especificar una acción" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Obtener configuración de WhatsApp del usuario
    const { data: configData, error: configError } = await supabase
      .from('user_whatsapp_config')
      .select('phone_number_id, secret_id')
      .eq('user_id', user.id)
      .single()

    if (configError || !configData) {
      console.error("Error al obtener configuración:", configError)
      return new Response(
        JSON.stringify({ error: "No se encontró configuración de WhatsApp para este usuario" }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Obtener el token de API desde Vault
    const { data: secretData, error: secretError } = await supabaseAdmin.vault.decrypt(configData.secret_id)
    
    if (secretError) {
      console.error("Error al obtener token desde Vault:", secretError)
      return new Response(
        JSON.stringify({ error: "Error al obtener credenciales seguras", details: secretError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Usar phone_number_id específico o el predeterminado del usuario
    const phoneNumberId = requestData.phone_number_id || configData.phone_number_id
    const apiToken = secretData.secret

    // Procesar diferentes acciones
    switch (requestData.action) {
      case 'send_message':
        return await handleSendMessage(
          phoneNumberId, 
          apiToken, 
          requestData, 
          user.id,
          corsHeaders,
          supabaseAdmin
        )
      
      case 'get_business_profile':
        return await handleGetProfile(phoneNumberId, apiToken, corsHeaders)
      
      case 'get_phone_numbers':
        return await handleGetPhoneNumbers(apiToken, corsHeaders)
      
      default:
        return new Response(
          JSON.stringify({ error: `Acción no soportada: ${requestData.action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error("Error inesperado:", error)
    return new Response(
      JSON.stringify({ error: "Error interno del servidor", details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function handleSendMessage(
  phoneNumberId: string, 
  apiToken: string, 
  requestData: ProxyRequest,
  userId: string,
  corsHeaders: Record<string, string>,
  supabaseAdmin: any
) {
  // Validar parámetros necesarios
  if (!requestData.recipient_phone || !requestData.message_content) {
    return new Response(
      JSON.stringify({ error: "Se requieren recipient_phone y message_content para enviar mensaje" }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Formatear número de teléfono (asegurarse que comienza con código de país)
  const recipientPhone = formatPhoneNumber(requestData.recipient_phone)

  // Construir mensaje según tipo
  let messageBody: WhatsAppMessage = {
    recipient_type: "individual",
    to: recipientPhone,
    type: requestData.message_type || "text"
  }

  if (messageBody.type === "text") {
    messageBody.text = {
      body: requestData.message_content
    }
  } else if (messageBody.type === "template") {
    messageBody.template = {
      name: requestData.template_name || "hello_world",
      language: {
        code: requestData.template_lang || "es"
      }
    }
  }

  try {
    // Llamar a la API de WhatsApp para enviar el mensaje
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
    )

    const responseData = await response.json()

    // Registrar el mensaje enviado
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
          })
      } catch (logError) {
        console.error("Error al registrar mensaje enviado:", logError)
        // Continuar a pesar del error de registro
      }
    }

    if (!response.ok) {
      console.error("Error al enviar mensaje de WhatsApp:", responseData)
      return new Response(
        JSON.stringify({ error: "Error al enviar mensaje", details: responseData }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, data: responseData }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error("Error al enviar mensaje:", error)
    return new Response(
      JSON.stringify({ error: "Error al comunicarse con la API de WhatsApp", details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
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
    )

    const responseData = await response.json()

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: "Error al obtener perfil de negocio", details: responseData }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, data: responseData }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Error al comunicarse con la API de WhatsApp", details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
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
    )

    const responseData = await response.json()

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: "Error al obtener números de teléfono", details: responseData }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, data: responseData }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Error al comunicarse con la API de WhatsApp", details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

function formatPhoneNumber(phone: string): string {
  // Eliminar espacios, guiones y paréntesis
  let cleaned = phone.replace(/[\s\-()]/g, '')
  
  // Asegurarse que comience con +
  if (!cleaned.startsWith('+')) {
    // Si comienza con 521 (México celular) o 52 (México fijo), agregar +
    if (cleaned.startsWith('521') || cleaned.startsWith('52')) {
      cleaned = '+' + cleaned
    } else {
      // Asumir México como predeterminado si no tiene código de país
      cleaned = '+52' + cleaned
    }
  }
  
  return cleaned
}
