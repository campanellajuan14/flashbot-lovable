
import React from "react";
import { AlertCircle } from "lucide-react";

interface WidgetErrorProps {
  error: string | null;
}

const WidgetError: React.FC<WidgetErrorProps> = ({ error }) => {
  // Log the error for debugging
  console.error("[WidgetError] Displaying error:", error);
  
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-background text-muted-foreground p-4 text-center gap-3">
      <AlertCircle className="h-10 w-10 text-destructive" />
      <h3 className="text-lg font-medium">Error</h3>
      <p>{error || "Error loading widget configuration"}</p>
      <p className="text-xs text-muted-foreground max-w-xs">
        This widget may not be enabled or could require domain access permissions.
      </p>
      <div className="text-xs text-muted-foreground mt-4 p-2 bg-muted/20 rounded max-w-xs overflow-auto">
        <p className="font-semibold">Debug Info:</p>
        <p>URL: {window.location.href}</p>
        <p>Widget ID: {window.location.pathname.split('/').pop() || 'Not found'}</p>
        <p>Referrer: {document.referrer || 'None'}</p>
      </div>
    </div>
  );
};

export default WidgetError;
