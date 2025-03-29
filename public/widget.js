
(function() {
  // Self-executing main function to initialize the chatbot widget
  function loadModules() {
    console.log('Starting widget initialization...');
    
    // Get widget ID from script tag
    const scriptTag = document.currentScript;
    const widgetId = scriptTag ? scriptTag.getAttribute('data-widget-id') : null;
    
    if (!widgetId) {
      console.error('Widget initialization failed: Missing data-widget-id attribute');
      return;
    }
    
    console.log('Initializing widget with ID:', widgetId);
    
    // Base URL for modules - derive from the current script's src
    const basePath = scriptTag ? new URL('./', scriptTag.src).href : '';
    
    // Create script elements for each module
    const modules = [
      `${basePath}widget/state.js`,
      `${basePath}widget/api.js`,
      `${basePath}widget/analytics.js`,
      `${basePath}widget/ui.js`,
      `${basePath}widget/index.js`
    ];
    
    // Count loaded modules to know when all are ready
    let loadedCount = 0;
    
    // Debug info for troubleshooting
    console.log('Script base path:', basePath);
    console.log('Using Supabase project: obiiomoqhpbgaymfphdz');
    
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
          import(`${basePath}widget/index.js`)
            .then(module => {
              // Expose the API globally
              window.flashbotChat = module.default;
              console.log('Widget API exposed as window.flashbotChat');
              
              // Initialize with the widget ID
              window.flashbotChat('init', { widget_id: widgetId });
              
              // Trigger any queued commands
              if (window.flashbotChatQueue && Array.isArray(window.flashbotChatQueue)) {
                console.log(`Processing ${window.flashbotChatQueue.length} queued commands`);
                window.flashbotChatQueue.forEach(args => {
                  window.flashbotChat.apply(null, args);
                });
                delete window.flashbotChatQueue;
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
  window.flashbotChat = function() {
    console.log('Command queued until widget loads:', Array.from(arguments));
    window.flashbotChatQueue = window.flashbotChatQueue || [];
    window.flashbotChatQueue.push(Array.from(arguments));
  };
  
  console.log('Widget script loaded, starting module loading...');
  // Initialize module loading
  loadModules();
})();
