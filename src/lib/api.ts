// API helpers for widget and chatbot functionality
import { env } from '@/config/environment';

// Use environment variables instead of hardcoded values
const ANON_KEY = env.supabase.anonKey;
const API_BASE_URL = env.api.baseUrl;

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
 * Reusable fetch function with error handling, retries and timeouts
 */
async function fetchWithRetry(url: string, options: RequestInit, retries = env.performance.maxRetries) {
  try {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), env.performance.connectionTimeout);
    
    // Add signal to options
    const fetchOptions = {
      ...options,
      signal: controller.signal
    };
    
    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      // Check if we should retry
      if (retries > 0 && [408, 429, 500, 502, 503, 504].includes(response.status)) {
        // Exponential backoff
        const delay = Math.min(Math.pow(2, env.performance.maxRetries - retries) * 1000, 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(url, options, retries - 1);
      }
      
      // Get error details
      let errorDetail;
      try {
        errorDetail = await response.json();
      } catch (e) {
        errorDetail = await response.text();
      }
      
      throw new Error(
        `API error: ${response.status} ${response.statusText}. ${JSON.stringify(errorDetail)}`
      );
    }
    
    return response;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout exceeded');
    }
    
    // Retry network errors
    if (retries > 0 && error instanceof TypeError && error.message.includes('network')) {
      const delay = Math.min(Math.pow(2, env.performance.maxRetries - retries) * 1000, 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1);
    }
    
    throw error;
  }
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
  
  const response = await fetchWithRetry(`${API_BASE_URL}/claude-chat`, {
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
  
  const data = await response.json();
  console.log('[API] Message sent successfully, received response:', {
    conversationId: data.conversation_id,
    messageLength: data.message?.length
  });
  
  return {
    message: data.message,
    conversation_id: data.conversation_id
  };
}

/**
 * Fetches widget configuration 
 */
export async function getWidgetConfig(widgetId: string) {
  const response = await fetchWithRetry(`${API_BASE_URL}/widget-config?widget_id=${widgetId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${ANON_KEY}`
    }
  });
  
  return response.json();
}

/**
 * Register a new conversation
 */
export async function registerConversation(chatbotId: string, source = 'web', widgetId?: string) {
  const response = await fetchWithRetry(`${API_BASE_URL}/register-conversation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${ANON_KEY}`
    },
    body: JSON.stringify({
      chatbotId,
      source,
      widgetId
    })
  });
  
  return response.json();
} 