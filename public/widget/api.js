
// API interactions
const API_BASE_URL = 'https://obiiomoqhpbgaymfphdz.supabase.co/functions/v1';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iaWlvbW9xaHBiZ2F5bWZwaGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3NjIyNTUsImV4cCI6MjA1MzMzODI1NX0.JAtEJ3nJucemX7rQd1I0zlTBGAVsNQ_SPGiULmjwfXY';

// Añadimos más intentos para recuperación de errores
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

/**
 * Fetch widget configuration from the API
 * @param {string} widgetId - The ID of the widget to fetch
 * @returns {Promise<object>} - The widget configuration
 */
export async function fetchWidgetConfig(widgetId, retryCount = 0) {
  try {
    console.log(`Intentando cargar configuración para widget ID: ${widgetId} (intento ${retryCount + 1}/${MAX_RETRIES + 1})`);
    console.log(`URL completo: ${API_BASE_URL}/widget-config?widget_id=${widgetId}`);
    
    const response = await fetch(`${API_BASE_URL}/widget-config?widget_id=${widgetId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY,
        'x-client-info': 'widget-client',
        'Origin': window.location.origin,
        'Referer': document.referrer || window.location.href
      },
      // Asegurarse de incluir las cookies en la solicitud
      credentials: 'include',
    });
    
    console.log(`Respuesta recibida con estado: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      // Si recibimos un 401, 403 o 429, intentamos de nuevo después de un pequeño retraso
      if ((response.status === 401 || response.status === 403 || response.status === 429) && retryCount < MAX_RETRIES) {
        console.log(`Reintentando solicitud (${retryCount + 1}/${MAX_RETRIES}) después de error ${response.status}`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
        return fetchWidgetConfig(widgetId, retryCount + 1);
      }
      
      console.error(`Error cargando widget: ${response.status} ${response.statusText}`);
      
      let errorMessage = 'Error al cargar la configuración del widget';
      try {
        const errorData = await response.json();
        if (errorData && errorData.error) {
          errorMessage = errorData.error;
          console.error(`Error detallado: ${errorData.error}`);
          if (errorData.details) {
            console.error(`Detalles adicionales: ${errorData.details}`);
          }
        }
      } catch (e) {
        try {
          const errorText = await response.text();
          console.error(`Contenido de la respuesta: ${errorText}`);
        } catch (textError) {
          console.error("No se pudo leer el contenido de la respuesta de error");
        }
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log('Widget config loaded successfully:', data);
    return data;
  } catch (error) {
    console.error('Widget config fetch error:', error);
    
    // Último intento con una configuración de respaldo si hemos agotado los reintentos
    if (retryCount >= MAX_RETRIES) {
      console.warn('Usando configuración de respaldo después de agotar reintentos');
      return {
        id: widgetId,
        name: "Chat Asistente",
        config: {
          appearance: {
            position: "right",
            theme: "light",
            initial_state: "closed",
            border_radius: 10,
            box_shadow: true
          },
          content: {
            title: "Chat Asistente",
            placeholder_text: "Escribe un mensaje...",
            welcome_message: "¡Hola! ¿En qué puedo ayudarte hoy?",
            branding: true
          },
          colors: {
            primary: "#2563eb",
            secondary: "#f1f5f9",
            background: "#ffffff",
            text: "#333333",
            user_bubble: "#2563eb",
            bot_bubble: "#f1f5f9",
            links: "#2563eb"
          },
          behavior: {
            persist_conversation: true,
            auto_open: false,
            auto_open_delay: 0,
            save_conversation_id: false
          }
        }
      };
    }
    throw error;
  }
}

export async function sendChatMessage(message, state) {
  try {
    console.log('Sending chat message:', message);
    const response = await fetch(`${API_BASE_URL}/claude-chat`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        // Adding apikey to header for anonymous access
        'apikey': ANON_KEY,
        'Origin': window.location.origin,
        'Referer': document.referrer || window.location.href
      },
      body: JSON.stringify({
        message,
        chatbotId: state.config.id,
        conversationId: state.conversationId,
        source: 'widget',
        widget_id: state.widgetId,
        user_info: state.userInfo
      }),
      // Asegurarse de incluir las cookies en la solicitud
      credentials: 'include',
    });
    
    if (!response.ok) {
      console.error(`Error sending message: ${response.status} ${response.statusText}`);
      throw new Error('Error sending message');
    }
    
    const data = await response.json();
    console.log('Message sent successfully, received response:', data);
    return data;
  } catch (error) {
    console.error('Message send error:', error);
    throw error;
  }
}
