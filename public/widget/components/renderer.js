
import { formatMessageContent } from './formatting.js';
import { trackEvent } from '../analytics.js';

/**
 * Render all messages in the chat window
 * @param {object} state - The widget state
 */
export function renderMessages(state) {
  const messagesContainer = document.getElementById('lovable-chatbot-messages');
  if (!messagesContainer) return;
  
  messagesContainer.innerHTML = '';
  
  state.messages.forEach(msg => {
    const messageEl = document.createElement('div');
    messageEl.style.marginBottom = '10px';
    messageEl.style.display = 'flex';
    
    if (msg.role === 'user') {
      messageEl.style.justifyContent = 'flex-end';
      messageEl.innerHTML = `
        <div style="background-color: ${state.config.config.colors.user_bubble || state.config.config.colors.primary}; color: white; padding: 8px 12px; border-radius: 18px 18px 0 18px; max-width: 80%;">
          ${formatMessageContent(msg.content, state.config.config.colors)}
        </div>
      `;
    } else {
      messageEl.style.justifyContent = 'flex-start';
      messageEl.innerHTML = `
        <div style="background-color: ${state.config.config.colors.bot_bubble || '#f1f0f0'}; color: ${state.config.config.colors.text || '#333333'}; padding: 8px 12px; border-radius: 18px 18px 18px 0; max-width: 80%;">
          ${formatMessageContent(msg.content, state.config.config.colors)}
        </div>
      `;
    }
    
    messagesContainer.appendChild(messageEl);
  });
  
  // Scroll to bottom
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Show welcome message if no messages exist
 * @param {object} state - The widget state
 */
export function showWelcomeMessage(state) {
  if (state.messages.length === 0) {
    // Check for custom greeting in behavior.greeting first
    const greeting = state.config?.behavior?.greeting || 
                     state.config?.config?.content?.welcome_message || 
                     'Hi! How can I help you today?';
    
    state.messages.push({
      role: 'assistant',
      content: greeting
    });
    renderMessages(state);
  }
}
