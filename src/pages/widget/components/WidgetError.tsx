
import React from "react";
import { AlertCircle } from "lucide-react";

interface WidgetErrorProps {
  error: string | null;
}

const WidgetError: React.FC<WidgetErrorProps> = ({ error }) => {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-background text-muted-foreground p-4 text-center gap-3">
      <AlertCircle className="h-10 w-10 text-destructive" />
      <h3 className="text-lg font-medium">Error</h3>
      <p>{error || "Error loading widget configuration :("}</p>
      <p className="text-xs text-muted-foreground max-w-xs">
        This widget may not be enabled or might require domain access permissions.
      </p>
    </div>
  );
};

export default WidgetError;
