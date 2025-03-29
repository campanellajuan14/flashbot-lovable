
import React from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui";

interface AnalyticsErrorProps {
  message?: string;
}

const AnalyticsError: React.FC<AnalyticsErrorProps> = ({ message = "Failed to load analytics data. Please try again later." }) => {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
};

export default AnalyticsError;
