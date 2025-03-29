
// API interactions
const API_BASE_URL = 'https://chatbot-platform.lovable.app/api';

export async function fetchWidgetConfig(widgetId) {
  const response = await fetch(`${API_BASE_URL}/widget-config?widget_id=${widgetId}`);
  if (!response.ok) throw new Error('Error al cargar configuración');
  return await response.json();
}

export async function sendChatMessage(message, state) {
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
  
  if (!response.ok) throw new Error('Error al enviar mensaje');
  return await response.json();
}
