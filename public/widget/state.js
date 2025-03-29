
// State management for the widget
export const createState = () => ({
  widgetId: null,
  config: null,
  isOpen: false,
  messages: [],
  conversationId: null,
  userInfo: null
});

// Save conversation to localStorage if configured
export function persistConversation(state) {
  if (state.config?.config?.behavior?.persist_conversation) {
    localStorage.setItem(`lovable_chat_${state.widgetId}`, JSON.stringify({
      messages: state.messages,
      conversationId: state.conversationId
    }));
  }
}

// Restore conversation from localStorage
export function restoreConversation(state) {
  if (state.config?.config?.behavior?.persist_conversation) {
    const savedConversation = localStorage.getItem(`lovable_chat_${state.widgetId}`);
    if (savedConversation) {
      try {
        const { messages, conversationId } = JSON.parse(savedConversation);
        state.messages = messages || [];
        state.conversationId = conversationId;
        return true;
      } catch (e) {
        console.error('Error al restaurar conversación:', e);
      }
    }
  }
  return false;
}
