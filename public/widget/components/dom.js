
import { toggleWidget } from './toggle.js';
import { handleSubmit } from './handlers.js';
import { trackEvent } from '../analytics.js';

/**
 * Create and append widget DOM elements
 * @param {object} state - The widget state
 * @returns {object} Object containing widget DOM elements
 */
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
  messagesContainer.style.display = 'flex';
  messagesContainer.style.flexDirection = 'column';
  messagesContainer.style.gap = '12px';
  
  // Create a flex layout to ensure proper positioning
  const layoutContainer = document.createElement('div');
  layoutContainer.style.display = 'flex';
  layoutContainer.style.flexDirection = 'column';
  layoutContainer.style.height = '100%';
  layoutContainer.style.flex = '1';
  layoutContainer.appendChild(messagesContainer);
  
  // Input
  const inputContainer = document.createElement('div');
  inputContainer.style.borderTop = '1px solid #eee';
  inputContainer.style.padding = '10px 15px';
  inputContainer.style.marginTop = 'auto';
  inputContainer.innerHTML = `
    <form id="lovable-chatbot-form" style="display: flex;">
      <input 
        type="text" 
        id="lovable-chatbot-input"
        placeholder="${state.config.config.content.placeholder_text || 'Type a message...'}"
        style="flex: 1; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px;"
      >
      <button 
        type="submit"
        style="margin-left: 10px; background: ${state.config.config.colors.primary}; color: white; border: none; border-radius: 4px; padding: 8px 12px; cursor: pointer;"
      >
        Send
      </button>
    </form>
  `;
  
  // Branding footer
  const footerHTML = `
    <div style="padding: 8px 15px; font-size: 11px; text-align: center; color: #999; border-top: 1px solid #eee;">
      <span>Made by Fran Conejos at Lovable Hackaton</span>
    </div>
  `;
  
  // Debug info container for easier troubleshooting
  const debugContainer = document.createElement('div');
  debugContainer.id = 'lovable-chatbot-debug';
  debugContainer.style.display = 'none';
  debugContainer.style.fontSize = '10px';
  debugContainer.style.padding = '8px';
  debugContainer.style.color = '#666';
  debugContainer.style.borderTop = '1px solid #eee';
  debugContainer.innerHTML = `Widget ID: ${state.widgetId}`;
  
  // Create a wrapper for input and footer to ensure they stay at bottom
  const bottomSection = document.createElement('div');
  bottomSection.style.marginTop = 'auto';
  
  // Assemble components
  chatWindow.appendChild(header);
  chatWindow.appendChild(layoutContainer);
  
  bottomSection.appendChild(inputContainer);
  // Always add footer
  const footer = document.createElement('div');
  footer.innerHTML = footerHTML;
  bottomSection.appendChild(footer);
  bottomSection.appendChild(debugContainer);
  
  chatWindow.appendChild(bottomSection);
  
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
