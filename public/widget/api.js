
// API module for Flashbot widget
const API_URL = 'https://obiiomoqhpbgaymfphdz.supabase.co/functions/v1';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iaWlvbW9xaHBiZ2F5bWZwaGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3NjIyNTUsImV4cCI6MjA1MzMzODI1NX0.JAtEJ3nJucemX7rQd1I0zlTBGAVsNQ_SPGiULmjwfXY';

/**
 * Fetch widget configuration from the server
 * @param {string} widgetId - The widget ID
 * @returns {Promise<object>} - The widget configuration
 */
export async function fetchWidgetConfig(widgetId) {
  console.log(`Fetching config for widget ID: ${widgetId}`);
  
  try {
    const response = await fetch(`${API_URL}/widget-config?widget_id=${widgetId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'x-client-info': 'widget-api-client',
        // Make sure CORS is handled correctly
        'Origin': window.location.origin
      }
    });
    
    if (!response.ok) {
      console.error(`Widget config error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Failed to load widget configuration: ${response.status}`);
    }
    
    const config = await response.json();
    console.log('Widget config loaded successfully:', config);
    return config;
  } catch (error) {
    console.error('Error fetching widget config:', error);
    throw new Error(`Widget configuration error: ${error.message}`);
  }
}

/**
 * Send a message to the chatbot
 * @param {string} message - The user's message
 * @param {string} widgetId - The widget ID
 * @param {string} conversationId - Optional conversation ID for continuing conversations
 * @returns {Promise<object>} - The chatbot's response
 */
export async function sendChatMessage(message, widgetId, conversationId = null) {
  console.log(`Sending message to chatbot. Widget ID: ${widgetId}, Conversation ID: ${conversationId || 'new'}`);
  
  try {
    const userInfo = {
      url: window.location.href,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      domain: window.location.hostname
    };
    
    const payload = {
      messages: [{ role: "user", content: message }],
      chatbotId: widgetId,
      conversationId: conversationId,
      source: 'widget',
      widget_id: widgetId,
      user_info: userInfo
    };
    
    console.log('Sending payload:', payload);
    
    const response = await fetch(`${API_URL}/claude-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'x-client-info': 'widget-api-client',
        'Origin': window.location.origin
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      console.error(`API error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Failed to get response: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('API response:', result);
    return result;
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw new Error(`Chat message error: ${error.message}`);
  }
}

// Export the API functions
export default {
  fetchWidgetConfig,
  sendChatMessage
};
