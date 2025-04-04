import { getRandomString } from "../utils/conversation.ts";

/**
 * Generate a response from the chatbot using Claude or other LLM
 */
export async function generateChatbotResponse(
  supabase: any,
  chatbotId: string,
  conversationId: string,
  userMessage: string,
  chatbot: any
): Promise<string> {
  console.log(`🧠 Generando respuesta para chatbot ${chatbotId}, conversación ${conversationId}`);
  
  const requestId = getRandomString(8); // Unique ID for request tracking
  
  try {
    // Determine which model to use based on chatbot configuration
    const model = chatbot?.settings?.model || 'gpt-4o';
    const maxTokens = chatbot?.settings?.maxTokens || 1000;
    const temperature = chatbot?.settings?.temperature || 0.7;
    const isAnthropic = model.includes('claude');
    
    console.log(`📋 [${requestId}] Usando modelo: ${model}, temperatura: ${temperature}, max_tokens: ${maxTokens}`);
    console.log(`🔍 [${requestId}] Mensaje del usuario: "${userMessage.substring(0, 50)}${userMessage.length > 50 ? '...' : ''}"`);
    
    // Prepare system instructions with configured behavior
    const systemPrompt = `${chatbot.behavior?.tone || 'Eres un asistente profesional y amable.'} ${chatbot.behavior?.instructions || ''}`;
    console.log(`📝 [${requestId}] Instrucciones del sistema: "${systemPrompt.substring(0, 100)}..."`);
    
    // Try with Edge claude-chat function first with a shorter timeout
    console.log(`🔄 [${requestId}] Invocando función Edge claude-chat...`);
    
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase.functions.invoke('claude-chat', {
        body: {
          messages: [
            // System message
            {
              role: 'system',
              content: systemPrompt
            },
            // User message
            { role: 'user', content: userMessage }
          ],
          model: model,
          chatbotId: chatbotId,
          conversationId: conversationId,
          source: 'whatsapp-webhook',
          request_id: requestId
        },
        // Set a timeout of 15 seconds
        fetchOptions: {
          signal: AbortSignal.timeout(15000)
        }
      });
      
      const responseTime = Date.now() - startTime;
      console.log(`⏱️ [${requestId}] Tiempo de respuesta: ${responseTime}ms`);
      
      if (error) {
        console.error(`❌ [${requestId}] Error invocando función Edge claude-chat:`, error);
        throw error;
      }
      
      if (!data || !data.message) {
        console.error(`❌ [${requestId}] Respuesta vacía o incompleta de claude-chat:`, data);
        return "Lo siento, no pude generar una respuesta adecuada en este momento.";
      }
      
      console.log(`✅ [${requestId}] Respuesta generada correctamente (${data.message.length} caracteres)`);
      console.log(`📃 [${requestId}] Vista previa: "${data.message.substring(0, 50)}${data.message.length > 50 ? '...' : ''}"`);
      
      // Check if fallback was used and log it
      if (data.used_fallback) {
        console.log(`ℹ️ [${requestId}] Se utilizó el fallback a OpenAI debido a sobrecarga de Claude`);
      }
      
      return data.message;
    } catch (functionError) {
      console.error(`❌ [${requestId}] Error en función Edge:`, functionError);
      
      // Determine if we should use fallback to OpenAI directly
      // Note: Now we shouldn't need this direct fallback as much since the claude-chat function has its own fallback,
      // but we'll keep it as an extra safety measure for timeout scenarios
      const shouldUseFallback = 
        functionError.name === 'AbortError' || 
        functionError.message?.includes('timeout') ||
        functionError.message?.includes('overloaded') ||
        functionError.message?.includes('Overloaded') ||
        (typeof functionError.message === 'string' && 
          (functionError.message.toLowerCase().includes('429') || 
           functionError.message.toLowerCase().includes('rate limit')));
      
      if (shouldUseFallback) {
        console.warn(`⚠️ [${requestId}] Detectado error de sobrecarga o timeout en función Edge, usando fallback directo a OpenAI`);
        
        // Try with direct call to OpenAI API
        console.log(`🔄 [${requestId}] Intentando llamada directa a OpenAI API...`);
        
        try {
          // Get OpenAI API key (make sure it's configured in secrets)
          const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
          
          if (!openaiApiKey) {
            console.error(`❌ [${requestId}] API key de OpenAI no está configurada`);
            throw new Error("API key de OpenAI no configurada");
          }
          
          const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${openaiApiKey}`
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",  // Use a faster model as fallback
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage }
              ],
              max_tokens: maxTokens,
              temperature: temperature
            })
          });
          
          if (!openaiResponse.ok) {
            // Try to get error details
            let errorDetail = "";
            try {
              const errorData = await openaiResponse.json();
              errorDetail = JSON.stringify(errorData);
            } catch (e) {
              errorDetail = await openaiResponse.text();
            }
            throw new Error(`Error de OpenAI API: ${openaiResponse.status} - ${errorDetail}`);
          }
          
          const openaiData = await openaiResponse.json();
          const message = openaiData.choices[0]?.message?.content;
          
          if (message) {
            console.log(`✅ [${requestId}] Respuesta recuperada de OpenAI directamente`);
            return message;
          } else {
            throw new Error("Respuesta de OpenAI no contiene mensaje");
          }
        } catch (openaiError) {
          console.error(`❌ [${requestId}] Error en llamada directa a OpenAI:`, openaiError);
          throw openaiError;
        }
      } else {
        // Other type of error
        throw functionError;
      }
    }
  } catch (error) {
    console.error(`❌ [${requestId}] Error generando respuesta:`, error);
    
    // Fallback message in case of error
    const fallbackMessage = "Lo siento, estoy teniendo dificultades para responder en este momento. Por favor, inténtalo de nuevo más tarde.";
    
    // Log diagnostic information
    try {
      await supabase.from('message_metrics').insert({
        chatbot_id: chatbotId,
        query: userMessage.substring(0, 500),
        has_documents: false,
        message_tokens: userMessage.length,
        metadata: {
          error: error.message || "Unknown error",
          timestamp: new Date().toISOString(),
          conversation_id: conversationId,
          request_id: requestId
        }
      });
    } catch (logError) {
      console.error(`❌ [${requestId}] Error registrando métrica de error:`, logError);
    }
    
    // Specific error message based on error type
    if (error.message?.includes('rate limit') || error.message?.includes('429')) {
      return "Lo siento, nuestro servicio está experimentando mucho tráfico. Por favor, intenta de nuevo en unos minutos.";
    }
    
    if (error.message?.includes('token') || error.message?.includes('auth')) {
      return "Lo siento, hay un problema con la autenticación del servicio. El equipo técnico ha sido notificado.";
    }
    
    return fallbackMessage;
  }
}
