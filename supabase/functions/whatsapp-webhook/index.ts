
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"
import * as crypto from "https://deno.land/std@0.177.0/crypto/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WebhookMessage {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: {
            name: string;
          };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          text?: {
            body: string;
          };
          type: string;
          [key: string]: unknown;
        }>;
        statuses?: Array<{
          id: string;
          status: string;
          timestamp: string;
          recipient_id: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

serve(async (req: Request) => {
  // Configuración de variables de entorno
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  const metaAppSecret = Deno.env.get('META_APP_SECRET') || ''
  
  // Cliente de Supabase con rol de servicio
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Manejar solicitud de verificación del webhook (GET)
  if (req.method === 'GET') {
    const url = new URL(req.url)
    const mode = url.searchParams.get('hub.mode')
    const challenge = url.searchParams.get('hub.challenge')
    const verifyToken = url.searchParams.get('hub.verify_token')
    const phoneNumberId = url.searchParams.get('phone_number_id')

    console.log(`Solicitud de verificación recibida: mode=${mode}, token=${verifyToken}, phone=${phoneNumberId}`)

    if (!phoneNumberId) {
      return new Response(
        JSON.stringify({ error: "Se requiere phone_number_id como parámetro" }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    // Buscar configuración de WhatsApp por phone_number_id
    const { data: configData, error: configError } = await supabase
      .from('user_whatsapp_config')
      .select('id, user_id, webhook_verify_token')
      .eq('phone_number_id', phoneNumberId)
      .single()

    if (configError || !configData) {
      console.error(`Error al buscar configuración para ${phoneNumberId}:`, configError)
      return new Response(
        JSON.stringify({ error: "No se encontró configuración para este phone_number_id" }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    // Verificar el token
    if (mode === 'subscribe' && verifyToken === configData.webhook_verify_token) {
      console.log(`Verificación exitosa para phone_number_id ${phoneNumberId}`)
      
      // Actualizar estado de verificación
      await supabase
        .from('user_whatsapp_config')
        .update({ webhook_verified: true })
        .eq('id', configData.id)

      // Responder con el challenge para completar la verificación
      return new Response(challenge || '', 
        { status: 200, headers: { 'Content-Type': 'text/plain', ...corsHeaders } }
      )
    } else {
      console.error(`Verificación fallida: token incorrecto para ${phoneNumberId}`)
      return new Response(
        JSON.stringify({ error: "Verificación fallida: token incorrecto" }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }
  }
  
  // Manejar notificaciones de eventos (POST)
  else if (req.method === 'POST') {
    // Clonar el request para poder leer el body varias veces
    const reqClone = req.clone()
    const rawBody = await req.text()
    
    // Verificar firma de Meta si se configuró el APP_SECRET
    if (metaAppSecret) {
      const signature = req.headers.get('x-hub-signature-256') || ''
      
      if (!signature) {
        console.warn("Solicitud sin firma (x-hub-signature-256)")
        return new Response(
          JSON.stringify({ error: "Se requiere firma de Meta" }),
          { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        )
      }
      
      // Verificar la firma
      const isValid = await verifySignature(rawBody, signature, metaAppSecret)
      
      if (!isValid) {
        console.error("Firma inválida. Posible solicitud no autorizada.")
        return new Response(
          JSON.stringify({ error: "Firma inválida" }),
          { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        )
      }
    }

    try {
      const data = JSON.parse(rawBody) as WebhookMessage
      
      // Verificar que es una notificación de WhatsApp
      if (data.object !== 'whatsapp_business_account') {
        return new Response(
          JSON.stringify({ error: "Tipo de evento no soportado" }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        )
      }

      // Procesar cada entrada
      for (const entry of data.entry) {
        for (const change of entry.changes) {
          if (change.field === 'messages') {
            const value = change.value
            const phoneNumberId = value.metadata.phone_number_id
            
            // Procesar mensajes entrantes
            if (value.messages && value.messages.length > 0) {
              for (const message of value.messages) {
                await processIncomingMessage(
                  supabase, 
                  phoneNumberId,
                  message,
                  value.contacts?.find(c => c.wa_id === message.from)?.profile.name || 'Unknown'
                )
              }
            }
            
            // Procesar actualizaciones de estado de mensajes
            if (value.statuses && value.statuses.length > 0) {
              for (const status of value.statuses) {
                await processMessageStatus(supabase, phoneNumberId, status)
              }
            }
          }
        }
      }

      // Responder rápidamente para evitar reintentos
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    } catch (error) {
      console.error("Error procesando webhook:", error)
      return new Response(
        JSON.stringify({ error: "Error procesando payload", details: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }
  } else {
    return new Response(
      JSON.stringify({ error: "Método no permitido" }),
      { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }
})

async function processIncomingMessage(
  supabase: any,
  phoneNumberId: string,
  message: any,
  senderName: string
) {
  console.log(`Procesando mensaje entrante de ${message.from} para ${phoneNumberId}`)
  
  try {
    // Encontrar configuración del usuario para este phone_number_id
    const { data: configData, error: configError } = await supabase
      .from('user_whatsapp_config')
      .select('user_id, active_chatbot_id, is_active')
      .eq('phone_number_id', phoneNumberId)
      .single()
      
    if (configError || !configData) {
      console.error(`No se encontró configuración para ${phoneNumberId}:`, configError)
      return
    }
    
    // Verificar si WhatsApp está activo para este usuario
    if (!configData.is_active) {
      console.log(`WhatsApp desactivado para phone_number_id ${phoneNumberId}`)
      return
    }
    
    // Verificar si hay un chatbot activo configurado
    if (!configData.active_chatbot_id) {
      console.log(`No hay chatbot activo para phone_number_id ${phoneNumberId}`)
      return
    }
    
    // Extraer el contenido del mensaje
    let messageContent = ''
    let messageType = message.type
    
    if (message.text) {
      messageContent = message.text.body
    } else if (message.image) {
      messageContent = '[Imagen]'
    } else if (message.audio) {
      messageContent = '[Audio]'
    } else if (message.video) {
      messageContent = '[Video]'
    } else if (message.document) {
      messageContent = '[Documento]'
    } else {
      messageContent = '[Mensaje no soportado]'
      messageType = 'unsupported'
    }
    
    // Registrar el mensaje recibido en la tabla de mensajes
    const { data: savedMessage, error: saveError } = await supabase
      .from('whatsapp_messages')
      .insert({
        user_id: configData.user_id,
        phone_number_id: phoneNumberId,
        chatbot_id: configData.active_chatbot_id,
        wa_message_id: message.id,
        from_number: message.from,
        to_number: phoneNumberId,
        message_type: messageType,
        message_content: messageContent,
        direction: 'inbound',
        timestamp: new Date(parseInt(message.timestamp) * 1000).toISOString(),
        metadata: {
          sender_name: senderName,
          raw_message: message
        }
      })
      .select()
    
    if (saveError) {
      console.error("Error al guardar mensaje entrante:", saveError)
      return
    }
    
    // Solo procesar mensajes de texto
    if (message.type === 'text') {
      // Buscar o crear una conversación para este remitente
      const { data: convData, error: convError } = await findOrCreateConversation(
        supabase,
        configData.active_chatbot_id,
        message.from,
        senderName
      )
      
      if (convError) {
        console.error("Error creando/buscando conversación:", convError)
        return
      }
      
      const conversationId = convData.id
      
      // Registrar mensaje del usuario en la tabla de mensajes de conversación
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content: messageContent,
          role: 'user',
          metadata: {
            source: 'whatsapp',
            phone: message.from,
            name: senderName
          }
        })
      
      // Actualizar el registro de WhatsApp con la conversación asociada
      await supabase
        .from('whatsapp_messages')
        .update({ conversation_id: conversationId })
        .eq('id', savedMessage[0].id)
      
      // Obtener datos del chatbot
      const { data: chatbot, error: chatbotError } = await supabase
        .from('chatbots')
        .select('behavior, settings')
        .eq('id', configData.active_chatbot_id)
        .single()
      
      if (chatbotError) {
        console.error("Error obteniendo datos del chatbot:", chatbotError)
        return
      }
      
      // Generar respuesta del chatbot usando Claude o GPT
      const response = await generateChatbotResponse(
        supabase,
        configData.active_chatbot_id,
        conversationId,
        messageContent,
        chatbot
      )
      
      if (!response) {
        console.error("No se pudo generar respuesta")
        return
      }
      
      // Registrar respuesta en la tabla de mensajes de conversación
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content: response,
          role: 'assistant',
          metadata: {
            source: 'whatsapp'
          }
        })
      
      // Enviar la respuesta a WhatsApp
      await sendWhatsAppResponse(
        supabase,
        phoneNumberId,
        configData.user_id, 
        message.from,
        response
      )
    }
  } catch (error) {
    console.error("Error procesando mensaje:", error)
  }
}

async function findOrCreateConversation(
  supabase: any,
  chatbotId: string,
  userIdentifier: string,
  userName: string
) {
  // Intentar encontrar una conversación existente para este número y chatbot
  const { data, error } = await supabase
    .from('conversations')
    .select()
    .eq('chatbot_id', chatbotId)
    .eq('user_identifier', userIdentifier)
    .order('created_at', { ascending: false })
    .limit(1)
  
  // Si existe, devolver la conversación
  if (!error && data && data.length > 0) {
    return { data: data[0], error: null }
  }
  
  // Si no existe o hubo un error, crear una nueva conversación
  return await supabase
    .from('conversations')
    .insert({
      chatbot_id: chatbotId,
      user_identifier: userIdentifier,
      metadata: {
        source: 'whatsapp',
        name: userName
      }
    })
    .select()
    .single()
}

async function generateChatbotResponse(
  supabase: any,
  chatbotId: string,
  conversationId: string,
  userMessage: string,
  chatbot: any
) {
  try {
    // Determinar qué modelo usar según la configuración del chatbot
    const model = chatbot?.settings?.model || 'gpt-4o'
    const isAnthropic = model.includes('claude')
    
    // Invocar función adecuada según el modelo
    if (isAnthropic) {
      const { data, error } = await supabase.functions.invoke('claude-chat', {
        body: {
          messages: [
            // Sistema
            {
              role: 'system',
              content: `${chatbot.behavior.tone || 'Eres un asistente profesional y amable.'} ${chatbot.behavior.instructions || ''}`
            },
            // Usuario
            { role: 'user', content: userMessage }
          ],
          model: model,
          chatbotId: chatbotId,
          conversationId: conversationId
        },
      })
      
      if (error) throw error
      return data.response
    } else {
      // Implementar llamada a OpenAI (similar a Claude pero con estructura adecuada para OpenAI)
      // Por simplicidad, reutilizamos Claude para ambos casos
      const { data, error } = await supabase.functions.invoke('claude-chat', {
        body: {
          messages: [
            // Sistema
            {
              role: 'system',
              content: `${chatbot.behavior.tone || 'Eres un asistente profesional y amable.'} ${chatbot.behavior.instructions || ''}`
            },
            // Usuario
            { role: 'user', content: userMessage }
          ],
          model: 'gpt-4o',
          chatbotId: chatbotId,
          conversationId: conversationId
        },
      })
      
      if (error) throw error
      return data.response
    }
  } catch (error) {
    console.error("Error generando respuesta:", error)
    return null
  }
}

async function sendWhatsAppResponse(
  supabase: any,
  phoneNumberId: string,
  userId: string,
  recipientPhone: string,
  message: string
) {
  try {
    // Obtener la configuración de WhatsApp
    const { data: configData, error: configError } = await supabase
      .from('user_whatsapp_config')
      .select('secret_id')
      .eq('phone_number_id', phoneNumberId)
      .single()
    
    if (configError) {
      console.error("Error obteniendo configuración:", configError)
      return null
    }
    
    // Obtener el token de API desde el vault
    const { data: secretData, error: secretError } = await supabase.vault.decrypt(configData.secret_id)
    
    if (secretError) {
      console.error("Error obteniendo secreto:", secretError)
      return null
    }
    
    const apiToken = secretData.secret
    
    // Enviar el mensaje a WhatsApp
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, 
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: recipientPhone,
          type: 'text',
          text: {
            preview_url: false,
            body: message
          }
        })
      }
    )
    
    const responseData = await response.json()
    
    if (!response.ok) {
      console.error("Error enviando mensaje:", responseData)
      return null
    }
    
    // Registrar mensaje enviado
    await supabase
      .from('whatsapp_messages')
      .insert({
        user_id: userId,
        phone_number_id: phoneNumberId,
        wa_message_id: responseData.messages?.[0]?.id,
        from_number: phoneNumberId,
        to_number: recipientPhone,
        message_type: 'text',
        message_content: message,
        direction: 'outbound',
        status: 'sent',
        metadata: responseData
      })
    
    return responseData
  } catch (error) {
    console.error("Error enviando respuesta:", error)
    return null
  }
}

async function processMessageStatus(supabase: any, phoneNumberId: string, status: any) {
  try {
    // Actualizar estado del mensaje en la base de datos
    await supabase
      .from('whatsapp_messages')
      .update({
        status: status.status,
        timestamp: new Date(parseInt(status.timestamp) * 1000).toISOString()
      })
      .eq('wa_message_id', status.id)
      .eq('phone_number_id', phoneNumberId)
    
  } catch (error) {
    console.error("Error actualizando estado del mensaje:", error)
  }
}

async function verifySignature(payload: string, signature: string, appSecret: string): Promise<boolean> {
  try {
    const signatureParts = signature.split('=')
    if (signatureParts.length !== 2) return false
    
    const algorithm = signatureParts[0]
    const expectedSignature = signatureParts[1]
    
    if (algorithm !== 'sha256') return false
    
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(appSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    )
    
    const actualSignature = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload)
    )
    
    // Convertir el ArrayBuffer a un string hexadecimal
    const hashArray = Array.from(new Uint8Array(actualSignature))
    const actualHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    
    return actualHex === expectedSignature
  } catch (error) {
    console.error("Error verificando firma:", error)
    return false
  }
}
