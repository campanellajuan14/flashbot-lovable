
(function() {
  // Self-executing main function to initialize the chatbot widget
  function loadModules() {
    console.log('Starting widget initialization...');
    
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
        console.log(`Module loaded: ${src}, ${loadedCount}/${modules.length}`);
        
        // When all modules are loaded, initialize the API
        if (loadedCount === modules.length) {
          console.log('All modules loaded, initializing widget...');
          import('./widget/index.js')
            .then(module => {
              // Expose the API globally
              window.lovableChatbot = module.default;
              console.log('Widget API exposed as window.lovableChatbot');
              
              // Trigger any queued commands
              if (window.lovableChatbotQueue && Array.isArray(window.lovableChatbotQueue)) {
                console.log(`Processing ${window.lovableChatbotQueue.length} queued commands`);
                window.lovableChatbotQueue.forEach(args => {
                  window.lovableChatbot.apply(null, args);
                });
                delete window.lovableChatbotQueue;
              }
            })
            .catch(err => console.error('Error loading chatbot modules:', err));
        }
      };
      script.onerror = (e) => console.error(`Failed to load module: ${src}`, e);
      document.head.appendChild(script);
    });
  }
  
  // Queue commands until the API is fully loaded
  window.lovableChatbot = function() {
    console.log('Command queued until widget loads:', Array.from(arguments));
    window.lovableChatbotQueue = window.lovableChatbotQueue || [];
    window.lovableChatbotQueue.push(Array.from(arguments));
  };
  
  console.log('Widget script loaded, starting module loading...');
  // Initialize module loading
  loadModules();
})();
