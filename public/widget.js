(function() {
  // Initial state
  const state = {
    widgetId: null,
    config: null,
    isOpen: false,
    messages: [],
    conversationId: null
  };
  
  // Initialize widget
  async function init(params) {
    if (!params.widget_id) {
      console.error('Se requiere widget_id para inicializar el chatbot');
      return;
    }
    
    state.widgetId = params.widget_id;
    state.userInfo = params.user_info || null;
    
    try {
      // Load configuration
      const response = await fetch(`https://chatbot-platform.lovable.app/api/widget-config?widget_id=${state.widgetId}`);
      if (!response.ok) throw new Error('Error al cargar configuración');
      
      const data = await response.json();
      state.config = data;
      
      // Create DOM elements
      createWidgetElements();
      
      // Restore conversation if enabled
      if (state.config.config.behavior.persist_conversation) {
        const savedConversation = localStorage.getItem(`lovable_chat_${state.widgetId}`);
        if (savedConversation) {
          try {
            const { messages, conversationId } = JSON.parse(savedConversation);
            state.messages = messages || [];
            state.conversationId = conversationId;
            renderMessages();
          } catch (e) {
            console.error('Error al restaurar conversación:', e);
          }
        }
      }
      
      // Auto-open if configured
      if (state.config.config.behavior.auto_open) {
        setTimeout(() => {
          toggleWidget(true);
        }, state.config.config.behavior.auto_open_delay * 1000);
      }
      
    } catch (error) {
      console.error('Error al inicializar widget:', error);
    }
  }
  
  // Create DOM elements
  function createWidgetElements() {
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
    button.addEventListener('click', () => toggleWidget(true));
    document.getElementById('lovable-chatbot-close').addEventListener('click', () => toggleWidget(false));
    document.getElementById('lovable-chatbot-form').addEventListener('submit', handleSubmit);
    
    // Show initial message if exists
    if (state.config.config.content.welcome_message && state.messages.length === 0) {
      state.messages.push({
        role: 'assistant',
        content: state.config.config.content.welcome_message
      });
      renderMessages();
    }
  }
  
  // Show/hide widget
  function toggleWidget(open) {
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
  function renderMessages() {
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
            ${formatMessageContent(msg.content)}
          </div>
        `;
      } else {
        messageEl.style.justifyContent = 'flex-start';
        messageEl.innerHTML = `
          <div style="background-color: ${state.config.config.colors.bot_bubble || '#f1f0f0'}; color: ${state.config.config.colors.text || '#333333'}; padding: 8px 12px; border-radius: 18px 18px 18px 0; max-width: 80%;">
            ${formatMessageContent(msg.content)}
          </div>
        `;
      }
      
      messagesContainer.appendChild(messageEl);
    });
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
  
  // Format message content (links, etc)
  function formatMessageContent(content) {
    // Convert URLs to links
    const linkedText = content.replace(
      /(https?:\/\/[^\s]+)/g, 
      `<a href="$1" target="_blank" style="color: ${state.config.config.colors.links || '#0078ff'};">$1</a>`
    );
    
    // Convert line breaks to <br>
    return linkedText.replace(/\n/g, '<br>');
  }
  
  // Handle message submission
  async function handleSubmit(e) {
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
    
    renderMessages();
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
      const response = await fetch('https://chatbot-platform.lovable.app/api/claude-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          chatbotId: state.config.id,
          conversationId: state.conversationId,
          source: 'widget',
          widget_id: state.widgetId,
          user_info: state.userInfo
        })
      });
      
      // Remove typing indicator
      indicatorContainer.remove();
      
      if (!response.ok) throw new Error('Error al enviar mensaje');
      
      const result = await response.json();
      
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
      
      renderMessages();
      
      // Persist conversation if configured
      if (state.config.config.behavior.persist_conversation) {
        localStorage.setItem(`lovable_chat_${state.widgetId}`, JSON.stringify({
          messages: state.messages,
          conversationId: state.conversationId
        }));
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Error message
      state.messages.push({
        role: 'assistant',
        content: 'Lo siento, ha ocurrido un error al procesar tu mensaje. Por favor, intenta de nuevo más tarde.'
      });
      
      renderMessages();
    }
  }
  
  // Track events for analytics
  function trackEvent(action, label, value) {
    // Google Analytics 4
    if (window.gtag && typeof window.gtag === 'function') {
      window.gtag('event', action, {
        'event_category': 'Chatbot',
        'event_label': label || state.widgetId,
        'value': value
      });
    }
    
    // Google Analytics Universal
    if (window.ga && typeof window.ga === 'function') {
      window.ga('send', 'event', 'Chatbot', action, label || state.widgetId, value);
    }
  }
  
  // Expose API
  window.lovableChatbot = function() {
    const args = Array.from(arguments);
    const command = args[0];
    
    switch (command) {
      case 'init':
        init(args[1] || {});
        break;
      case 'open':
        toggleWidget(true);
        break;
      case 'close':
        toggleWidget(false);
        break;
      case 'toggle':
        toggleWidget(!state.isOpen);
        break;
    }
  };
})();
