
import { trackEvent } from '../analytics.js';
import { registerConversation } from '../api.js';

/**
 * Toggle widget visibility
 * @param {boolean} open - Whether to open or close the widget
 * @param {object} state - The widget state
 */
export function toggleWidget(open, state) {
  state.isOpen = open;
  const chatWindow = document.getElementById('lovable-chatbot-window');
  const button = document.getElementById('lovable-chatbot-button');
  
  if (!chatWindow || !button) {
    console.error('Failed to find widget elements for toggling');
    return;
  }
  
  if (open) {
    chatWindow.style.display = 'flex';
    button.style.display = 'none';
    
    // Track widget open
    trackEvent('widget_open');
  } else {
    chatWindow.style.display = 'none';
    button.style.display = 'flex';
    
    // Register conversation when closing the chat if there are messages
    if (state.messages && state.messages.length > 0 && state.conversationId) {
      console.log('Registering conversation on widget close:', state.conversationId);
      registerConversation(state)
        .then(result => console.log('Conversation registered on widget close:', result))
        .catch(err => console.error('Error registering conversation on close:', err));
      
      // Track widget close with conversation
      trackEvent('widget_close_with_conversation');
    } else {
      console.log('Closing widget without registering conversation:', 
                 state.messages ? state.messages.length : 0, 'messages, conversationId:', state.conversationId);
      // Track widget close without conversation
      trackEvent('widget_close');
    }
  }
}
