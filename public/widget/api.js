
// API interactions
const API_BASE_URL = 'https://obiiomoqhpbgaymfphdz.supabase.co/functions/v1';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iaWlvbW9xaHBiZ2F5bWZwaGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3NjIyNTUsImV4cCI6MjA1MzMzODI1NX0.JAtEJ3nJucemX7rQd1I0zlTBGAVsNQ_SPGiULmjwfXY';

// Enhanced retries and debugging
const MAX_RETRIES = 5;
const RETRY_DELAY = 1000;

/**
 * Fetch widget configuration from the API
 * @param {string} widgetId - The ID of the widget to fetch
 * @returns {Promise<object>} - The widget configuration
 */
export async function fetchWidgetConfig(widgetId, retryCount = 0) {
  try {
    const requestUrl = `${API_BASE_URL}/widget-config?widget_id=${widgetId}`;
    
    console.log(`Attempting to load configuration for widget ID: ${widgetId} (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);
    console.log(`Full URL: ${requestUrl}`);
    
    // Create a set of headers that will work reliably for public access
    const headers = {
      'Content-Type': 'application/json',
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${ANON_KEY}`,
      'x-client-info': 'widget-client',
      'Origin': window.location.origin,
      'Referer': document.referrer || window.location.href
    };
    
    console.log('Using headers:', {
      'Content-Type': 'application/json',
      'apikey': ANON_KEY ? 'Key is set' : 'Key is missing',
      'Authorization': ANON_KEY ? 'Bearer token is set' : 'Bearer token is missing',
      'Origin': window.location.origin,
      'Referer': document.referrer || window.location.href
    });
    
    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: headers,
      credentials: 'omit' // Don't send cookies, use the anon key only
    });
    
    console.log(`Response received with status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      // More aggressive retry for various error codes
      if (retryCount < MAX_RETRIES) {
        console.log(`Retrying request (${retryCount + 1}/${MAX_RETRIES}) after error ${response.status}`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
        return fetchWidgetConfig(widgetId, retryCount + 1);
      }
      
      console.error(`Error loading widget: ${response.status} ${response.statusText}`);
      
      let errorMessage = 'Error loading widget configuration';
      try {
        const errorData = await response.json();
        if (errorData && errorData.error) {
          errorMessage = errorData.error;
          console.error(`Detailed error: ${errorData.error}`);
          if (errorData.details) {
            console.error(`Additional details: ${errorData.details}`);
          }
          if (errorData.tip) {
            console.error(`Tip: ${errorData.tip}`);
          }
        }
      } catch (e) {
        try {
          const errorText = await response.text();
          console.error(`Response content: ${errorText}`);
        } catch (textError) {
          console.error("Could not read error response content");
        }
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log('Widget config loaded successfully:', data);
    return data;
  } catch (error) {
    console.error('Widget config fetch error:', error);
    
    // Last attempt with fallback configuration after exhausting retries
    if (retryCount >= MAX_RETRIES) {
      console.warn('Using fallback configuration after exhausting retries');
      return {
        id: widgetId,
        name: "Chat Assistant",
        config: {
          appearance: {
            position: "right",
            theme: "light",
            initial_state: "closed",
            border_radius: 10,
            box_shadow: true
          },
          content: {
            title: "Chat Assistant",
            placeholder_text: "Type a message...",
            welcome_message: "Hello! How can I help you today?",
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
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'Origin': window.location.origin,
        'Referer': document.referrer || window.location.href,
        'x-client-info': 'widget-client'
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: message }],
        chatbotId: state.config.id,
        conversationId: state.conversationId,
        source: 'widget',
        widget_id: state.widgetId,
        user_info: state.userInfo
      }),
      // Use omit to ensure clean requests
      credentials: 'omit',
    });
    
    if (!response.ok) {
      console.error(`Error sending message: ${response.status} ${response.statusText}`);
      
      // Try to get more error details
      try {
        const errorData = await response.json();
        console.error('Error details:', errorData);
      } catch (e) {
        // If can't parse JSON, try to get text
        try {
          const errorText = await response.text();
          console.error('Error response:', errorText);
        } catch (textError) {
          console.error('Could not read error response');
        }
      }
      
      throw new Error('Error sending message');
    }
    
    const data = await response.json();
    console.log('Message sent successfully, received response:', data);
    return { answer: data.message };
  } catch (error) {
    console.error('Message send error:', error);
    throw error;
  }
}
