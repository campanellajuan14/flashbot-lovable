
import React from "react";
import { AlertCircle, Bug, Server, Smartphone } from "lucide-react";

interface WidgetErrorProps {
  error: string | null;
}

const WidgetError: React.FC<WidgetErrorProps> = ({ error }) => {
  // Log the error for debugging
  console.error("[WidgetError] Displaying error:", error);
  
  // Create a diagnostic ID for troubleshooting
  const diagnosticId = `widget-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
  
  // Get basic diagnostic info
  const diagnosticInfo = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    widgetId: window.location.pathname.split('/').pop() || 'Not found',
    referrer: document.referrer || 'None',
    userAgent: navigator.userAgent,
    screenSize: `${window.innerWidth}x${window.innerHeight}`,
    diagnosticId
  };
  
  // Log diagnostic information 
  console.error("[WidgetError] Diagnostic information:", diagnosticInfo);
  
  // Log to widget diagnostics if available
  if (typeof window !== 'undefined' && window.widgetDiagnostics) {
    window.widgetDiagnostics.addEvent('ERROR_DISPLAYED', 'Widget error component rendered', {
      error,
      diagnosticInfo
    });
  }
  
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-background text-muted-foreground p-4 text-center gap-3">
      <AlertCircle className="h-10 w-10 text-destructive" />
      <h3 className="text-lg font-medium">Widget Error</h3>
      <p>{error || "Error loading widget configuration"}</p>
      <p className="text-xs text-muted-foreground max-w-xs">
        This widget may not be enabled or could require domain access permissions.
      </p>
      
      <div className="text-xs text-muted-foreground mt-4 p-2 bg-muted/20 rounded max-w-xs overflow-auto">
        <div className="flex items-center mb-1">
          <Bug className="h-3 w-3 mr-1" />
          <p className="font-semibold">Debug Info:</p>
        </div>
        <div className="grid grid-cols-[auto_1fr] gap-x-2 text-left">
          <span className="text-muted">ID:</span>
          <span className="font-mono">{diagnosticId}</span>
          
          <span className="text-muted">Widget ID:</span>
          <span className="font-mono truncate">{diagnosticInfo.widgetId}</span>
          
          <span className="text-muted">Time:</span>
          <span>{new Date().toLocaleTimeString()}</span>
          
          <span className="text-muted">URL:</span>
          <span className="truncate">{window.location.href}</span>
        </div>
        
        <button 
          onClick={() => {
            console.log("Full diagnostics:", diagnosticInfo);
            if (window.widgetDiagnostics) {
              console.log("Widget event history:", window.widgetDiagnostics.events);
            }
            alert("Diagnostic information logged to console");
          }}
          className="mt-2 p-1 bg-muted hover:bg-muted/80 rounded text-xs w-full flex items-center justify-center"
        >
          <Server className="h-3 w-3 mr-1" /> Show Full Diagnostics
        </button>
      </div>
    </div>
  );
};

export default WidgetError;
