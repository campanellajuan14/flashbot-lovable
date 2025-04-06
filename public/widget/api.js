
// API interactions
const API_BASE_URL = 'https://obiiomoqhpbgaymfphdz.supabase.co/functions/v1';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iaWlvbW9xaHBiZ2F5bWZwaGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3NjIyNTUsImV4cCI6MjA1MzMzODI1NX0.JAtEJ3nJucemX7rQd1I0zlTBGAVsNQ_SPGiULmjwfXY';

// Enhanced retries and debugging
const MAX_RETRIES = 5;
const RETRY_DELAY = 1000;

// Debug helper
function logApiAttempt(action, details) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [Widget API] [${action}]`, details);
  
  // If in window context, add to diagnostic queue for UI
  if (typeof window !== 'undefined' && window.widgetDiagnostics) {
    window.widgetDiagnostics.push({ timestamp, action, details });
  }
}

// Initialize diagnostics array in window
if (typeof window !== 'undefined') {
  window.widgetDiagnostics = window.widgetDiagnostics || [];
}

/**
 * Fetch widget configuration from the API
 * @param {string} widgetId - The ID of the widget to fetch
 * @returns {Promise<object>} - The widget configuration
 */
export async function fetchWidgetConfig(widgetId, retryCount = 0) {
  try {
    const requestUrl = `${API_BASE_URL}/widget-config?widget_id=${widgetId}`;
    
    logApiAttempt('FETCH_CONFIG', {
      widgetId,
      attempt: retryCount + 1, 
      maxRetries: MAX_RETRIES + 1,
      url: requestUrl
    });
    
    // Create a set of headers that will work reliably for public access
    const headers = {
      'Content-Type': 'application/json',
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${ANON_KEY}`,
      'x-client-info': 'widget-client',
      'Origin': window.location.origin,
      'Referer': document.referrer || window.location.href
    };
    
    logApiAttempt('REQUEST_HEADERS', {
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
    
    logApiAttempt('RESPONSE_RECEIVED', { 
      status: response.status, 
      statusText: response.statusText 
    });
    
    if (!response.ok) {
      // More aggressive retry for various error codes
      if (retryCount < MAX_RETRIES) {
        logApiAttempt('RETRY_SCHEDULED', {
          retryCount: retryCount + 1,
          delay: RETRY_DELAY * (retryCount + 1),
          status: response.status
        });
        
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
        return fetchWidgetConfig(widgetId, retryCount + 1);
      }
      
      logApiAttempt('ERROR_RESPONSE', {
        status: response.status,
        statusText: response.statusText
      });
      
      let errorMessage = 'Error loading widget configuration';
      try {
        const errorData = await response.json();
        if (errorData && errorData.error) {
          errorMessage = errorData.error;
          logApiAttempt('ERROR_DETAILS', errorData);
        }
      } catch (e) {
        try {
          const errorText = await response.text();
          logApiAttempt('ERROR_TEXT', { text: errorText });
        } catch (textError) {
          logApiAttempt('ERROR_UNREADABLE', { error: String(textError) });
        }
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    logApiAttempt('CONFIG_LOADED', {
      chatbotId: data.id,
      name: data.name,
      configKeys: Object.keys(data.config || {})
    });
    
    return data;
  } catch (error) {
    logApiAttempt('FETCH_ERROR', {
      error: error.message,
      stack: error.stack
    });
    
    // Last attempt with fallback configuration after exhausting retries
    if (retryCount >= MAX_RETRIES) {
      logApiAttempt('USING_FALLBACK', { widgetId });
      
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
    console.log('Using conversation ID:', state.conversationId);
    
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
    
    // Store the conversation ID for future messages
    if (data.conversation_id && !state.conversationId) {
      state.conversationId = data.conversation_id;
      console.log('Received and stored conversation ID:', data.conversation_id);
    }
    
    return { answer: data.message, conversation_id: data.conversation_id };
  } catch (error) {
    console.error('Message send error:', error);
    throw error;
  }
}

/**
 * Register conversation and messages in the database
 * @param {object} state - The widget state
 * @returns {Promise<object>} - The result of the registration
 */
export async function registerConversation(state) {
  // Only register if there are messages and a conversation ID
  if (!state.messages || state.messages.length === 0 || !state.conversationId) {
    console.log('Skipping conversation registration: no messages or conversation ID');
    return;
  }
  
  try {
    console.log('Registering conversation to database:', {
      conversationId: state.conversationId,
      messageCount: state.messages.length
    });
    
    const response = await fetch(`${API_BASE_URL}/register-conversation`, {
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
        conversation_id: state.conversationId,
        chatbot_id: state.config.id,
        messages: state.messages,
        user_identifier: state.userInfo?.id || 'anonymous'
      }),
      credentials: 'omit',
    });
    
    if (!response.ok) {
      console.error(`Error registering conversation: ${response.status} ${response.statusText}`);
      try {
        const errorData = await response.json();
        console.error('Error details:', errorData);
      } catch (e) {
        console.error('Could not parse error response');
      }
      return;
    }
    
    const data = await response.json();
    console.log('Conversation registered successfully:', data);
    return data;
    
  } catch (error) {
    console.error('Error registering conversation:', error);
    // Silent error to not disrupt user experience
    return null;
  }
}
