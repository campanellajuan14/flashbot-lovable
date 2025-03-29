
import { trackEvent } from '../analytics.js';

/**
 * Toggle widget visibility
 * @param {boolean} open - Whether to open or close the widget
 * @param {object} state - The widget state
 */
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
