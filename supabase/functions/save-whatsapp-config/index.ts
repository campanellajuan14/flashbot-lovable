
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type WhatsAppConfig = {
  phone_number_id: string
  waba_id: string
  api_token: string
  active_chatbot_id?: string
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

    // Crear cliente de Supabase con token de autenticación del usuario
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } },
    })

    // Crear cliente con rol de servicio para almacenar el token en vault
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    // Verificar autenticación del usuario
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error("Error de autenticación:", authError)
      return new Response(
        JSON.stringify({ error: "No autorizado. Debe iniciar sesión para configurar WhatsApp." }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Obtener datos del cuerpo de la petición
    const { phone_number_id, waba_id, api_token, active_chatbot_id } = await req.json() as WhatsAppConfig

    // Validar datos de entrada
    if (!phone_number_id || !waba_id || !api_token) {
      return new Response(
        JSON.stringify({ error: "Faltan datos requeridos: phone_number_id, waba_id y api_token son obligatorios" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar formato de phone_number_id y waba_id (deben ser valores numéricos)
    if (!/^\d+$/.test(phone_number_id) || !/^\d+$/.test(waba_id)) {
      return new Response(
        JSON.stringify({ error: "phone_number_id y waba_id deben ser valores numéricos" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar el token con la API de WhatsApp
    try {
      const response = await fetch(`https://graph.facebook.com/v18.0/${phone_number_id}`, {
        headers: {
          'Authorization': `Bearer ${api_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error verificando token con API de WhatsApp:", errorData)
        return new Response(
          JSON.stringify({ 
            error: "El token de API proporcionado no es válido o no tiene permisos para acceder a este Phone Number ID",
            details: errorData
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Extraer información útil de la respuesta
      const phoneInfo = await response.json()
      console.log("Verificación exitosa con WhatsApp API:", phoneInfo)
    } catch (error) {
      console.error("Error al comunicarse con la API de WhatsApp:", error)
      return new Response(
        JSON.stringify({ error: "Error al comunicarse con la API de WhatsApp", details: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Guardar token en Vault usando el cliente admin
    const secretName = `whatsapp_token_${user.id}`
    const { data: secretData, error: secretError } = await supabaseAdmin.vault.encrypt({
      name: secretName,
      secret: api_token,
      key_id: 'default'  // Usar la clave por defecto del vault
    })

    if (secretError) {
      console.error("Error al guardar token en Vault:", secretError)
      return new Response(
        JSON.stringify({ error: "Error al guardar credenciales de forma segura", details: secretError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Crear o actualizar registro en la tabla user_whatsapp_config
    const { data: configData, error: configError } = await supabase
      .from('user_whatsapp_config')
      .upsert({
        user_id: user.id,
        phone_number_id,
        waba_id,
        secret_id: secretData.id,
        active_chatbot_id: active_chatbot_id || null
      }, {
        onConflict: 'user_id'
      })
      .select()

    if (configError) {
      console.error("Error al guardar configuración:", configError)
      return new Response(
        JSON.stringify({ error: "Error al guardar configuración de WhatsApp", details: configError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Configuración de WhatsApp guardada con éxito",
        data: {
          phone_number_id,
          waba_id,
          webhook_verify_token: configData[0].webhook_verify_token
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error("Error inesperado:", error)
    return new Response(
      JSON.stringify({ error: "Error interno del servidor", details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
