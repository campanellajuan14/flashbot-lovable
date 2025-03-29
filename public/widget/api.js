
// API interactions
const API_BASE_URL = 'https://obiiomoqhpbgaymfphdz.supabase.co/functions/v1';

export async function fetchWidgetConfig(widgetId) {
  try {
    console.log(`Fetching widget config for ID: ${widgetId}`);
    console.log(`Full request URL: ${API_BASE_URL}/widget-config?widget_id=${widgetId}`);
    
    const response = await fetch(`${API_BASE_URL}/widget-config?widget_id=${widgetId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`Error fetching widget config: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`Response body: ${errorText}`);
      throw new Error('Error al cargar configuración');
    }
    
    const data = await response.json();
    console.log('Widget config loaded successfully:', data);
    return data;
  } catch (error) {
    console.error('Widget config fetch error:', error);
    throw error;
  }
}

export async function sendChatMessage(message, state) {
  try {
    console.log('Sending chat message:', message);
    const response = await fetch(`${API_BASE_URL}/claude-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        chatbotId: state.config.id,
        conversationId: state.conversationId,
        source: 'widget',
        widget_id: state.widgetId,
        user_info: state.userInfo
      })
    });
    
    if (!response.ok) {
      console.error(`Error sending message: ${response.status} ${response.statusText}`);
      throw new Error('Error al enviar mensaje');
    }
    
    const data = await response.json();
    console.log('Message sent successfully, received response:', data);
    return data;
  } catch (error) {
    console.error('Message send error:', error);
    throw error;
  }
}
