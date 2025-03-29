
(function() {
  // Self-executing main function to initialize the chatbot widget
  function loadModules() {
    console.log('Starting widget initialization...');
    
    // Get widget ID from script tag
    const scriptTag = document.currentScript;
    const widgetId = scriptTag ? scriptTag.getAttribute('data-widget-id') : null;
    
    if (!widgetId) {
      console.error('Widget initialization failed: Missing data-widget-id attribute');
      // Add a visual error element
      const errorDiv = document.createElement('div');
      errorDiv.style = `position: fixed; bottom: 20px; right: 20px; background: #f8d7da; 
                       color: #721c24; padding: 10px; border-radius: 5px; font-size: 12px;
                       font-family: sans-serif; z-index: 10000; max-width: 300px;`;
      errorDiv.innerHTML = `
        <strong>Widget Error</strong>
        <p>Missing data-widget-id attribute in script tag.</p>
        <p>Widget ID: <code>${widgetId || 'undefined'}</code></p>
      `;
      document.body.appendChild(errorDiv);
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
    console.log('Current page origin:', window.location.origin);
    console.log('Current page URL:', window.location.href);
    console.log('Document referrer:', document.referrer);
    
    // Add a timeout to detect loading problems
    const loadTimeout = setTimeout(() => {
      console.error('Widget modules loading timeout - some modules may have failed to load');
    }, 10000);
    
    modules.forEach(src => {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = src;
      script.onload = () => {
        loadedCount++;
        console.log(`Module loaded: ${src}, ${loadedCount}/${modules.length}`);
        
        // When all modules are loaded, initialize the API
        if (loadedCount === modules.length) {
          clearTimeout(loadTimeout);
          console.log('All modules loaded, initializing widget...');
          import(`${basePath}widget/index.js`)
            .then(module => {
              // Expose the API globally
              window.flashbotChat = module.default;
              console.log('Widget API exposed as window.flashbotChat');
              
              // Initialize with the widget ID
              window.flashbotChat('init', { 
                widget_id: widgetId,
                // Optionally add user information
                user_info: {
                  url: window.location.href,
                  referrer: document.referrer,
                  userAgent: navigator.userAgent,
                  timestamp: new Date().toISOString(),
                  domain: window.location.hostname
                }
              });
              
              // Trigger any queued commands
              if (window.flashbotChatQueue && Array.isArray(window.flashbotChatQueue)) {
                console.log(`Processing ${window.flashbotChatQueue.length} queued commands`);
                window.flashbotChatQueue.forEach(args => {
                  window.flashbotChat.apply(null, args);
                });
                delete window.flashbotChatQueue;
              }
            })
            .catch(err => {
              console.error('Error loading chatbot modules:', err);
              // Try to recover from error
              const errorDiv = document.createElement('div');
              errorDiv.style = `position: fixed; bottom: 20px; right: 20px; background: #f8d7da; 
                               color: #721c24; padding: 10px; border-radius: 5px; font-size: 12px;
                               font-family: sans-serif; z-index: 10000; max-width: 300px;`;
              errorDiv.innerHTML = `
                <strong>Widget Error</strong>
                <p>Widget loading failed. Please contact administrator.</p>
                <p>Error: ${err.message}</p>
                <p>Widget ID: <code>${widgetId}</code></p>
              `;
              document.body.appendChild(errorDiv);
            });
        }
      };
      script.onerror = (e) => {
        console.error(`Failed to load module: ${src}`, e);
        // Increment counter to avoid hanging
        loadedCount++;
        
        // Show visual error
        const errorDiv = document.createElement('div');
        errorDiv.style = `position: fixed; bottom: 20px; right: 20px; background: #f8d7da; 
                         color: #721c24; padding: 10px; border-radius: 5px; font-size: 12px;
                         font-family: sans-serif; z-index: 10000; max-width: 300px;`;
        errorDiv.innerHTML = `
          <strong>Widget Error</strong>
          <p>Error loading module: ${src}</p>
          <p>Widget ID: <code>${widgetId}</code></p>
        `;
        document.body.appendChild(errorDiv);
      };
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
  
  // Try to detect if we're in an iframe
  const isIframe = window !== window.parent;
  console.log('Is iframe:', isIframe);
  
  // Initialize module loading
  loadModules();
})();
