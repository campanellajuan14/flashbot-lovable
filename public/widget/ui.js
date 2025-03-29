
import { persistConversation } from './state.js';
import { sendChatMessage } from './api.js';
import { trackEvent } from './analytics.js';

// Formatting utilities
function formatMessageContent(content, colors) {
  // Convert URLs to links
  const linkedText = content.replace(
    /(https?:\/\/[^\s]+)/g, 
    `<a href="$1" target="_blank" style="color: ${colors.links || '#0078ff'};">$1</a>`
  );
  
  // Convert line breaks to <br>
  return linkedText.replace(/\n/g, '<br>');
}

// UI Components and interactions
export function createWidgetElements(state) {
  // Main container
  const container = document.createElement('div');
  container.id = 'lovable-chatbot-container';
  container.style.position = 'fixed';
  container.style.zIndex = state.config.config.appearance.z_index || 9999;
  container.style.bottom = `${state.config.config.appearance.offset_y || 20}px`;
  
  if (state.config.config.appearance.position === 'right') {
    container.style.right = `${state.config.config.appearance.offset_x || 20}px`;
  } else {
    container.style.left = `${state.config.config.appearance.offset_x || 20}px`;
  }
  
  // Button
  const button = document.createElement('div');
  button.id = 'lovable-chatbot-button';
  button.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="#ffffff"/>
  </svg>`;
  button.style.backgroundColor = state.config.config.colors.primary;
  button.style.borderRadius = '50%';
  button.style.width = '60px';
  button.style.height = '60px';
  button.style.display = 'flex';
  button.style.alignItems = 'center';
  button.style.justifyContent = 'center';
  button.style.cursor = 'pointer';
  button.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
  
  // Chat window
  const chatWindow = document.createElement('div');
  chatWindow.id = 'lovable-chatbot-window';
  chatWindow.style.display = 'none';
  chatWindow.style.flexDirection = 'column';
  chatWindow.style.width = state.config.config.appearance.width || '350px';
  chatWindow.style.height = state.config.config.appearance.height || '500px';
  chatWindow.style.backgroundColor = state.config.config.colors.background || '#ffffff';
  chatWindow.style.borderRadius = `${state.config.config.appearance.border_radius || 10}px`;
  chatWindow.style.overflow = 'hidden';
  chatWindow.style.boxShadow = state.config.config.appearance.box_shadow ? '0 4px 12px rgba(0,0,0,0.15)' : 'none';
  
  // Header
  const header = document.createElement('div');
  header.style.padding = '15px';
  header.style.backgroundColor = state.config.config.colors.primary;
  header.style.color = '#ffffff';
  header.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h3 style="margin: 0; font-size: 16px;">${state.config.config.content.title || 'Chat'}</h3>
        ${state.config.config.content.subtitle ? `<p style="margin: 5px 0 0; font-size: 12px;">${state.config.config.content.subtitle}</p>` : ''}
      </div>
      <div id="lovable-chatbot-close" style="cursor: pointer;">✕</div>
    </div>
  `;
  
  // Messages
  const messagesContainer = document.createElement('div');
  messagesContainer.id = 'lovable-chatbot-messages';
  messagesContainer.style.flex = '1';
  messagesContainer.style.padding = '15px';
  messagesContainer.style.overflowY = 'auto';
  
  // Input
  const inputContainer = document.createElement('div');
  inputContainer.style.borderTop = '1px solid #eee';
  inputContainer.style.padding = '10px 15px';
  inputContainer.innerHTML = `
    <form id="lovable-chatbot-form" style="display: flex;">
      <input 
        type="text" 
        id="lovable-chatbot-input"
        placeholder="${state.config.config.content.placeholder_text || 'Escribe un mensaje...'}"
        style="flex: 1; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px;"
      >
      <button 
        type="submit"
        style="margin-left: 10px; background: ${state.config.config.colors.primary}; color: white; border: none; border-radius: 4px; padding: 8px 12px; cursor: pointer;"
      >
        Enviar
      </button>
    </form>
  `;
  
  // Branding footer
  let footerHTML = '';
  if (state.config.config.content.branding) {
    footerHTML = `
      <div style="padding: 8px 15px; font-size: 11px; text-align: center; color: #999; border-top: 1px solid #eee;">
        <a href="https://lovable.dev" target="_blank" style="color: #999; text-decoration: none;">
          Powered by Lovable
        </a>
      </div>
    `;
  }
  
  // Assemble components
  chatWindow.appendChild(header);
  chatWindow.appendChild(messagesContainer);
  chatWindow.appendChild(inputContainer);
  if (footerHTML) {
    const footer = document.createElement('div');
    footer.innerHTML = footerHTML;
    chatWindow.appendChild(footer);
  }
  
  container.appendChild(button);
  container.appendChild(chatWindow);
  
  // Add to body
  document.body.appendChild(container);
  
  // Add event listeners
  button.addEventListener('click', () => toggleWidget(true, state));
  document.getElementById('lovable-chatbot-close').addEventListener('click', () => toggleWidget(false, state));
  document.getElementById('lovable-chatbot-form').addEventListener('submit', (e) => handleSubmit(e, state));
  
  // Return the created elements for further manipulation
  return { container, chatWindow, messagesContainer };
}

// Show/hide widget
export function toggleWidget(open, state) {
  state.isOpen = open;
  const chatWindow = document.getElementById('lovable-chatbot-window');
  const button = document.getElementById('lovable-chatbot-button');
  
  if (open) {
    chatWindow.style.display = 'flex';
    button.style.display = 'none';
    
    // Track widget open
    trackEvent('widget_open');
  } else {
    chatWindow.style.display = 'none';
    button.style.display = 'flex';
  }
}

// Render messages
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

// Handle form submission
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
    typingIndicator.innerHTML = 'Escribiendo...';
    
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
    
  } catch (error) {
    console.error('Error sending message:', error);
    
    // Error message
    state.messages.push({
      role: 'assistant',
      content: 'Lo siento, ha ocurrido un error al procesar tu mensaje. Por favor, intenta de nuevo más tarde.'
    });
    
    renderMessages(state);
  }
}

// Show welcome message
export function showWelcomeMessage(state) {
  if (state.config.config.content.welcome_message && state.messages.length === 0) {
    state.messages.push({
      role: 'assistant',
      content: state.config.config.content.welcome_message
    });
    renderMessages(state);
  }
}
