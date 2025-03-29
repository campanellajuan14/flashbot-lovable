
import React from "react";
import { Alert, AlertDescription } from "@/components/ui";
import { AlertCircle } from "lucide-react";

interface ErrorDisplayProps {
  errorMessage: string | null;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ errorMessage }) => {
  if (!errorMessage) return null;

  // Translate error messages if needed
  let displayMessage = errorMessage;
  if (errorMessage.includes("no se ha configurado")) {
    displayMessage = "OpenAI API key is not configured. Please contact system administrator to configure this key.";
  } else if (errorMessage.includes("Ocurrió un error")) {
    displayMessage = "An error occurred while processing documents. Please try again.";
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{displayMessage}</AlertDescription>
    </Alert>
  );
};

export default ErrorDisplay;
