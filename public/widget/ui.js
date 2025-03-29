
// Main UI module for the Lovable chatbot widget
import { createWidgetElements } from './components/dom.js';
import { toggleWidget } from './components/toggle.js';
import { renderMessages, showWelcomeMessage } from './components/renderer.js';
import { handleSubmit } from './components/handlers.js';
import { formatMessageContent } from './components/formatting.js';

// Export all the functions needed by other modules
export {
  createWidgetElements,
  toggleWidget,
  renderMessages,
  showWelcomeMessage,
  handleSubmit,
  formatMessageContent
};
