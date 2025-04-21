// API interactions with improved error handling and stability

// Configuration - these will be injected during build
const API_BASE_URL = 'https://obiiomoqhpbgaymfphdz.supabase.co/functions/v1';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iaWlvbW9xaHBiZ2F5bWZwaGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3NjIyNTUsImV4cCI6MjA1MzMzODI1NX0.JAtEJ3nJucemX7rQd1I0zlTBGAVsNQ_SPGiULmjwfXY';

// Enhanced retries and debugging
const MAX_RETRIES = 5;
const RETRY_DELAY = 1000;
const REQUEST_TIMEOUT = 15000; // 15 seconds

/**
 * Reusable fetch function with improved error handling and retry logic
 * @param {string} url - The URL to fetch
 * @param {object} options - Fetch options
 * @param {number} retryCount - Current retry attempt (internal use)
 * @returns {Promise<Response>} - Fetch response
 */
async function fetchWithRetry(url, options, retryCount = 0) {
  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    
    // Add abort signal to options
    const fetchOptions = {
      ...options,
      signal: controller.signal
    };
    
    console.log(`Fetching ${url} (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);
    
    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);
    
    // Check for common error status codes
    if (!response.ok) {
      console.warn(`Response error: ${response.status} ${response.statusText}`);
      
      // Determine if we should retry based on status code
      if (retryCount < MAX_RETRIES && 
          [408, 429, 500, 502, 503, 504].includes(response.status)) {
        const delay = RETRY_DELAY * Math.pow(2, retryCount);
        console.log(`Retrying in ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(url, options, retryCount + 1);
      }
      
      // Parse error response
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        try {
          errorData = { message: await response.text() };
        } catch (textError) {
          errorData = { message: 'Unknown error occurred' };
        }
      }
      
      throw new Error(
        `API Error (${response.status}): ${errorData.error || errorData.message || response.statusText}`
      );
    }
    
    return response;
  } catch (error) {
    // Handle timeout errors
    if (error.name === 'AbortError') {
      console.error('Request timeout exceeded');
      
      if (retryCount < MAX_RETRIES) {
        const delay = RETRY_DELAY * Math.pow(2, retryCount);
        console.log(`Retrying after timeout in ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(url, options, retryCount + 1);
      }
      
      throw new Error('Request timed out after multiple attempts');
    }
    
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('network')) {
      console.error('Network error occurred:', error.message);
      
      if (retryCount < MAX_RETRIES) {
        const delay = RETRY_DELAY * Math.pow(2, retryCount);
        console.log(`Retrying after network error in ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(url, options, retryCount + 1);
      }
    }
    
    // Re-throw enhanced error
    throw error;
  }
}

/**
 * Fetch widget configuration from the API
 * @param {string} widgetId - The ID of the widget to fetch
 * @returns {Promise<object>} - The widget configuration
 */
export async function fetchWidgetConfig(widgetId) {
  if (!widgetId) {
    throw new Error('Widget ID is required');
  }
  
  try {
    const requestUrl = `${API_BASE_URL}/widget-config?widget_id=${widgetId}`;
    console.log(`Loading configuration for widget ID: ${widgetId}`);
    
    // Create a set of headers that will work reliably for public access
    const headers = {
      'Content-Type': 'application/json',
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${ANON_KEY}`,
      'x-client-info': 'widget-client',
      'Origin': window.location.origin || 'null',
      'Referer': document.referrer || window.location.href
    };
    
    const response = await fetchWithRetry(requestUrl, {
      method: 'GET',
      headers: headers,
      credentials: 'omit' // Don't send cookies, use the anon key only
    });
    
    const data = await response.json();
    console.log('Widget configuration loaded successfully');
    return data;
  } catch (error) {
    console.error('Error loading widget configuration:', error.message);
    throw error;
  }
}

/**
 * Register a new conversation
 * @param {string} chatbotId - The chatbot ID
 * @param {string} source - Source of the conversation (default: 'widget')
 * @param {string} widgetId - The widget ID
 * @returns {Promise<object>} - The conversation data
 */
export async function registerConversation(chatbotId, source = 'widget', widgetId) {
  if (!chatbotId) {
    throw new Error('Chatbot ID is required');
  }
  
  try {
    const requestUrl = `${API_BASE_URL}/register-conversation`;
    console.log(`Registering new conversation for chatbot: ${chatbotId}`);
    
    const headers = {
      'Content-Type': 'application/json',
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${ANON_KEY}`,
      'x-client-info': 'widget-client',
      'Origin': window.location.origin || 'null'
    };
    
    const response = await fetchWithRetry(requestUrl, {
      method: 'POST',
      headers: headers,
      credentials: 'omit',
      body: JSON.stringify({
        chatbotId,
        source,
        widgetId
      })
    });
    
    const data = await response.json();
    console.log('Conversation registered successfully:', data.conversationId);
    return data;
  } catch (error) {
    console.error('Error registering conversation:', error.message);
    throw error;
  }
}

/**
 * Send a message to the chatbot
 * @param {string} message - The message text
 * @param {string} chatbotId - The chatbot ID
 * @param {string} conversationId - The conversation ID
 * @param {string} source - Source of the message (default: 'widget')
 * @param {string} widgetId - The widget ID
 * @returns {Promise<object>} - The response data
 */
export async function sendMessage(message, chatbotId, conversationId, source = 'widget', widgetId) {
  if (!message || !chatbotId || !conversationId) {
    throw new Error('Message, chatbot ID and conversation ID are required');
  }
  
  try {
    const requestUrl = `${API_BASE_URL}/claude-chat`;
    console.log(`Sending message to chatbot: ${chatbotId}`);
    
    const headers = {
      'Content-Type': 'application/json',
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${ANON_KEY}`,
      'x-client-info': 'widget-client',
      'Origin': window.location.origin || 'null'
    };
    
    const response = await fetchWithRetry(requestUrl, {
      method: 'POST',
      headers: headers,
      credentials: 'omit',
      body: JSON.stringify({
        messages: [{ role: 'user', content: message }],
        chatbotId,
        conversationId,
        source,
        widgetId
      })
    });
    
    const data = await response.json();
    console.log('Message sent successfully');
    return data;
  } catch (error) {
    console.error('Error sending message:', error.message);
    throw error;
  }
}
