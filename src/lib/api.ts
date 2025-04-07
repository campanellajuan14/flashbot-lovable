// API helpers for widget and chatbot functionality

const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iaWlvbW9xaHBiZ2F5bWZwaGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3NjIyNTUsImV4cCI6MjA1MzMzODI1NX0.JAtEJ3nJucemX7rQd1I0zlTBGAVsNQ_SPGiULmjwfXY';
const API_BASE_URL = 'https://obiiomoqhpbgaymfphdz.supabase.co/functions/v1';

interface ChatMessageParams {
  message: string;
  chatbotId: string;
  conversationId: string | null;
  source?: string;
  widgetId?: string;
}

interface ChatMessageResponse {
  message: string;
  conversation_id: string;
}

/**
 * Sends a chat message to the API
 */
export async function sendChatMessage(params: ChatMessageParams): Promise<ChatMessageResponse> {
  const { message, chatbotId, conversationId, source, widgetId } = params;
  
  console.log("[API] Sending chat message:", {
    chatbotId,
    conversationId,
    source,
    messageLength: message.length
  });
  
  // SIMULACIÓN: Evitamos la llamada a la API que falla
  console.log("[API] SIMULANDO RESPUESTA - Endpoint original:", `${API_BASE_URL}/claude-chat`);
  
  // Crear un retraso artificial para simular la llamada de red
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Generar una respuesta simulada basada en el mensaje del usuario
  let simulatedResponse = "Lo siento, estoy en modo simulación y no puedo responder de forma inteligente ahora mismo.";
  
  // Opcionalmente, podríamos agregar algunas respuestas predefinidas basadas en palabras clave
  if (message.toLowerCase().includes("hola")) {
    simulatedResponse = "¡Hola! ¿En qué puedo ayudarte hoy?";
  } else if (message.toLowerCase().includes("ayuda")) {
    simulatedResponse = "Estoy aquí para ayudarte. Puedes preguntarme sobre Flashbot y te responderé lo mejor que pueda.";
  } else if (message.toLowerCase().includes("gracias")) {
    simulatedResponse = "¡De nada! Estoy aquí para ayudarte.";
  }
  
  console.log('[API] Simulación completada, generando respuesta:', {
    conversationId: conversationId || `sim-${Date.now()}`,
    messageLength: simulatedResponse.length
  });
  
  return {
    message: simulatedResponse,
    conversation_id: conversationId || `sim-${Date.now()}`
  };
  
  /* CÓDIGO ORIGINAL COMENTADO 
  const response = await fetch(`${API_BASE_URL}/claude-chat`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${ANON_KEY}`,
      'x-client-info': source || 'web-client',
      'Origin': window.location.origin,
      'Referer': document.referrer || window.location.href
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: message }],
      chatbotId,
      conversationId,
      source: source || 'widget_embed',
      widget_id: widgetId,
      user_info: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        timestamp: new Date().toISOString()
      }
    })
  });
  
  if (!response.ok) {
    console.error(`[API] Error sending message: ${response.status} ${response.statusText}`);
    
    // Try to get more error details
    try {
      const errorData = await response.json();
      console.error('[API] Error details:', errorData);
      throw new Error(errorData.error || 'Error sending message');
    } catch (e) {
      // If can't parse JSON, try to get text
      try {
        const errorText = await response.text();
        console.error('[API] Error response text:', errorText);
        throw new Error(errorText || 'Error sending message');
      } catch (textError) {
        console.error('[API] Could not read error response');
        throw new Error('Error sending message');
      }
    }
  }
  
  const data = await response.json();
  console.log('[API] Message sent successfully, received response:', {
    conversationId: data.conversation_id,
    messageLength: data.message?.length
  });
  
  return {
    message: data.message,
    conversation_id: data.conversation_id
  };
  */
} 