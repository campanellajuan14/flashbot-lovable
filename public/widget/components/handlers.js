
import { sendChatMessage, registerConversation } from '../api.js';
import { renderMessages } from './renderer.js';
import { persistConversation } from '../state.js';
import { trackEvent } from '../analytics.js';

/**
 * Handle message submission
 * @param {Event} e - The submit event
 * @param {object} state - The widget state
 */
export async function handleSubmit(e, state) {
  e.preventDefault();
  
  const input = document.getElementById('lovable-chatbot-input');
  const message = input.value.trim();
  
  if (!message) return;
  
  // Clean input
  input.value = '';
  
  // Add user message
  state.messages.push({
    role: 'user',
    content: message
  });
  
  renderMessages(state);
  trackEvent('message_sent');
  
  try {
    // Typing indicator
    const typingIndicator = document.createElement('div');
    typingIndicator.id = 'typing-indicator';
    typingIndicator.style.padding = '8px 12px';
    typingIndicator.style.marginBottom = '10px';
    typingIndicator.style.display = 'inline-block';
    typingIndicator.style.backgroundColor = '#f1f0f0';
    typingIndicator.style.borderRadius = '18px 18px 18px 0';
    typingIndicator.innerHTML = 'Typing...';
    
    const messagesContainer = document.getElementById('lovable-chatbot-messages');
    const indicatorContainer = document.createElement('div');
    indicatorContainer.style.display = 'flex';
    indicatorContainer.style.justifyContent = 'flex-start';
    indicatorContainer.appendChild(typingIndicator);
    messagesContainer.appendChild(indicatorContainer);
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Send message to server
    const result = await sendChatMessage(message, state);
    
    // Remove typing indicator
    indicatorContainer.remove();
    
    // Save conversation ID if first response
    if (result.conversation_id && !state.conversationId) {
      state.conversationId = result.conversation_id;
      
      // Track new conversation
      trackEvent('conversation_started');
    }
    
    // Add chatbot response
    state.messages.push({
      role: 'assistant',
      content: result.answer
    });
    
    renderMessages(state);
    
    // Persist conversation if configured
    persistConversation(state);
    
    // Register conversation in database
    registerConversation(state);
    
  } catch (error) {
    console.error('Error sending message:', error);
    
    // Error message
    state.messages.push({
      role: 'assistant',
      content: 'Sorry, an error occurred while processing your message. Please try again later.'
    });
    
    renderMessages(state);
  }
}
