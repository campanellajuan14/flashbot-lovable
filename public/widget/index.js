
import { createState, restoreConversation } from './state.js';
import { fetchWidgetConfig } from './api.js';
import { createWidgetElements, toggleWidget, renderMessages, showWelcomeMessage } from './ui.js';

// Main widget initialization function
async function init(params) {
  if (!params.widget_id) {
    console.error('Se requiere widget_id para inicializar el chatbot');
    return;
  }
  
  const state = createState();
  state.widgetId = params.widget_id;
  state.userInfo = params.user_info || null;
  
  try {
    // Load configuration
    state.config = await fetchWidgetConfig(state.widgetId);
    
    // Create DOM elements
    createWidgetElements(state);
    
    // Restore conversation if enabled
    if (restoreConversation(state)) {
      renderMessages(state);
    }
    
    // Show initial welcome message
    showWelcomeMessage(state);
    
    // Auto-open if configured
    if (state.config.config.behavior.auto_open) {
      setTimeout(() => {
        toggleWidget(true, state);
      }, state.config.config.behavior.auto_open_delay * 1000);
    }
    
  } catch (error) {
    console.error('Error al inicializar widget:', error);
  }
}

// Widget API
export default function() {
  const args = Array.from(arguments);
  const command = args[0];
  const state = createState();
  
  switch (command) {
    case 'init':
      init(args[1] || {});
      break;
    case 'open':
      toggleWidget(true, state);
      break;
    case 'close':
      toggleWidget(false, state);
      break;
    case 'toggle':
      toggleWidget(!state.isOpen, state);
      break;
  }
}
