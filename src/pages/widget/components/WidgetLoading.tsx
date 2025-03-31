
import React from "react";
import { Loader2 } from "lucide-react";

const WidgetLoading: React.FC = () => {
  return (
    <div className="h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
};

export default WidgetLoading;
