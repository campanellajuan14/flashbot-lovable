
// API interactions
const API_BASE_URL = 'https://obiiomoqhpbgaymfphdz.supabase.co/functions/v1';

export async function fetchWidgetConfig(widgetId) {
  try {
    console.log(`Fetching widget config for ID: ${widgetId}`);
    console.log(`Full request URL: ${API_BASE_URL}/widget-config?widget_id=${widgetId}`);
    
    const response = await fetch(`${API_BASE_URL}/widget-config?widget_id=${widgetId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Adding apikey to header to pass authentication
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iaWlvbW9xaHBiZ2F5bWZwaGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3NjIyNTUsImV4cCI6MjA1MzMzODI1NX0.JAtEJ3nJucemX7rQd1I0zlTBGAVsNQ_SPGiULmjwfXY'
      }
    });
    
    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      console.error(`Error fetching widget config: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`Response body: ${errorText}`);
      throw new Error('Error loading configuration');
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
      headers: { 
        'Content-Type': 'application/json',
        // Adding apikey to header to pass authentication
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iaWlvbW9xaHBiZ2F5bWZwaGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3NjIyNTUsImV4cCI6MjA1MzMzODI1NX0.JAtEJ3nJucemX7rQd1I0zlTBGAVsNQ_SPGiULmjwfXY'
      },
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
