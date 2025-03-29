
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";

interface FormActionsProps {
  isSubmitting: boolean;
  isEditing: boolean;
}

const FormActions = ({ isSubmitting, isEditing }: FormActionsProps) => {
  const navigate = useNavigate();

  const handleCancelClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default button behavior
    e.stopPropagation(); // Stop event propagation
    navigate("/chatbots");
  };

  return (
    <div className="mt-6 flex justify-end gap-4">
      <Button 
        type="button" 
        variant="outline"
        onClick={handleCancelClick}
      >
        Cancel
      </Button>
      <Button
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isEditing ? "Updating..." : "Creating..."}
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            {isEditing ? "Update Chatbot" : "Create Chatbot"}
          </>
        )}
      </Button>
    </div>
  );
};

export default FormActions;
