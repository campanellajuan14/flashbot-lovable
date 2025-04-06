
(function() {
  // Self-executing main function to initialize the chatbot widget
  function loadModules() {
    console.log('[Widget] Starting widget initialization...');
    
    // Create diagnostic object for debugging
    window.flashbotDiagnostics = {
      startTime: new Date().toISOString(),
      browser: navigator.userAgent,
      logs: [],
      addLog: function(type, message, data) {
        this.logs.push({
          timestamp: new Date().toISOString(),
          type: type,
          message: message,
          data: data || null
        });
        console.log(`[Widget] [${type}]`, message, data || '');
      }
    };
    
    // Log diagnostic information
    window.flashbotDiagnostics.addLog('INIT', 'Widget script loaded', {
      url: window.location.href,
      referrer: document.referrer,
      scriptElement: document.currentScript ? true : false
    });
    
    // Get widget ID from script tag
    const scriptTag = document.currentScript;
    const widgetId = scriptTag ? scriptTag.getAttribute('data-widget-id') : null;
    
    window.flashbotDiagnostics.addLog('CONFIG', 'Widget ID from script tag', { widgetId });
    
    if (!widgetId) {
      window.flashbotDiagnostics.addLog('ERROR', 'Missing widget ID', null);
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
        <button onclick="console.log(window.flashbotDiagnostics); alert('Diagnostic info logged to console');" 
                style="background: #721c24; color: white; border: none; padding: 5px; border-radius: 3px; font-size: 10px; margin-top: 5px;">
          Show Diagnostics
        </button>
      `;
      document.body.appendChild(errorDiv);
      return;
    }
    
    window.flashbotDiagnostics.addLog('INIT', 'Initializing with widget ID', { widgetId });
    
    // Base URL for modules - derive from the current script's src
    const basePath = scriptTag ? new URL('./', scriptTag.src).href : '';
    window.flashbotDiagnostics.addLog('PATHS', 'Script base path', { basePath });
    
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
    window.flashbotDiagnostics.addLog('ENV', 'Environment info', {
      project: 'obiiomoqhpbgaymfphdz',
      origin: window.location.origin,
      url: window.location.href,
      referrer: document.referrer
    });
    
    // Add a timeout to detect loading problems
    const loadTimeout = setTimeout(() => {
      window.flashbotDiagnostics.addLog('ERROR', 'Module loading timeout', {
        loadedCount,
        totalModules: modules.length
      });
      
      console.error('Widget modules loading timeout - some modules may have failed to load');
      showErrorMessage('Widget modules loading timeout. Check browser console for details.');
    }, 10000);
    
    modules.forEach(src => {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = src;
      script.onload = () => {
        loadedCount++;
        window.flashbotDiagnostics.addLog('MODULE', 'Module loaded', {
          src,
          count: `${loadedCount}/${modules.length}`
        });
        
        // When all modules are loaded, initialize the API
        if (loadedCount === modules.length) {
          clearTimeout(loadTimeout);
          window.flashbotDiagnostics.addLog('COMPLETE', 'All modules loaded', null);
          
          import(`${basePath}widget/index.js`)
            .then(module => {
              // Expose the API globally
              window.flashbotChat = module.default;
              window.flashbotDiagnostics.addLog('API', 'Widget API exposed', null);
              
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
                window.flashbotDiagnostics.addLog('QUEUE', 'Processing queued commands', {
                  count: window.flashbotChatQueue.length
                });
                
                window.flashbotChatQueue.forEach(args => {
                  window.flashbotChat.apply(null, args);
                });
                delete window.flashbotChatQueue;
              }
            })
            .catch(err => {
              window.flashbotDiagnostics.addLog('ERROR', 'Failed to import index module', {
                error: err.message,
                stack: err.stack
              });
              
              console.error('Error loading chatbot modules:', err);
              // Try to recover from error
              showErrorMessage(`Widget module loading failed: ${err.message}. Widget ID: ${widgetId}`);
            });
        }
      };
      script.onerror = (e) => {
        window.flashbotDiagnostics.addLog('ERROR', 'Failed to load module', {
          src,
          error: e.type
        });
        
        console.error(`Failed to load module: ${src}`, e);
        // Increment counter to avoid hanging
        loadedCount++;
        
        // Show visual error
        showErrorMessage(`Failed to load module: ${src}. Check your connection and try again.`);
      };
      document.head.appendChild(script);
    });
  }
  
  // Helper function to show error messages
  function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style = `position: fixed; bottom: 20px; right: 20px; background: #f8d7da; 
                   color: #721c24; padding: 10px; border-radius: 5px; font-size: 12px;
                   font-family: sans-serif; z-index: 10000; max-width: 300px;`;
    errorDiv.innerHTML = `
      <strong>Widget Error</strong>
      <p>${message}</p>
      <button onclick="console.log(window.flashbotDiagnostics); alert('Diagnostic info logged to console');" 
              style="background: #721c24; color: white; border: none; padding: 5px; border-radius: 3px; font-size: 10px; margin-top: 5px;">
        Show Diagnostics
      </button>
      <button style="background: #721c24; color: white; border: none; padding: 5px; border-radius: 3px; margin-top: 5px; margin-left: 5px; cursor: pointer; font-size: 10px;" 
              onclick="this.parentNode.style.display='none'">
        Dismiss
      </button>
    `;
    document.body.appendChild(errorDiv);
  }
  
  // Queue commands until the API is fully loaded
  window.flashbotChat = function() {
    const args = Array.from(arguments);
    console.log('Command queued until widget loads:', args);
    window.flashbotChatQueue = window.flashbotChatQueue || [];
    window.flashbotChatQueue.push(args);
  };
  
  console.log('Widget script loaded, starting module loading...');
  
  // Try to detect if we're in an iframe
  const isIframe = window !== window.parent;
  console.log('Is iframe:', isIframe);
  
  // Initialize module loading with a small delay to ensure DOM is ready
  setTimeout(loadModules, 100);
})();
