
(function() {
  // Self-executing main function to initialize the chatbot widget
  function loadModules() {
    // Create script elements for each module
    const modules = [
      'widget/state.js',
      'widget/api.js',
      'widget/analytics.js',
      'widget/ui.js',
      'widget/index.js'
    ];
    
    // Count loaded modules to know when all are ready
    let loadedCount = 0;
    
    modules.forEach(src => {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = src;
      script.onload = () => {
        loadedCount++;
        
        // When all modules are loaded, initialize the API
        if (loadedCount === modules.length) {
          import('./widget/index.js')
            .then(module => {
              // Expose the API globally
              window.lovableChatbot = module.default;
              
              // Trigger any queued commands
              if (window.lovableChatbotQueue && Array.isArray(window.lovableChatbotQueue)) {
                window.lovableChatbotQueue.forEach(args => {
                  window.lovableChatbot.apply(null, args);
                });
                delete window.lovableChatbotQueue;
              }
            })
            .catch(err => console.error('Error loading chatbot modules:', err));
        }
      };
      script.onerror = () => console.error(`Failed to load module: ${src}`);
      document.head.appendChild(script);
    });
  }
  
  // Queue commands until the API is fully loaded
  window.lovableChatbot = function() {
    window.lovableChatbotQueue = window.lovableChatbotQueue || [];
    window.lovableChatbotQueue.push(Array.from(arguments));
  };
  
  // Initialize module loading
  loadModules();
})();
