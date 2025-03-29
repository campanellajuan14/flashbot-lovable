
import React from "react";
import { Alert, AlertDescription } from "@/components/ui";
import { AlertCircle } from "lucide-react";

interface ErrorDisplayProps {
  errorMessage: string | null;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ errorMessage }) => {
  if (!errorMessage) return null;

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{errorMessage}</AlertDescription>
    </Alert>
  );
};

export default ErrorDisplay;
