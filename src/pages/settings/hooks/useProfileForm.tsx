
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProfileFormData {
  businessName: string;
  email: string;
}

export const useProfileForm = () => {
  const { user, isLoading } = useAuth();
  const [formData, setFormData] = useState<ProfileFormData>({
    businessName: "",
    email: "",
  });
  const [isUpdating, setIsUpdating] = useState(false);
  
  useEffect(() => {
    if (user) {
      setFormData({
        businessName: user.businessName || "",
        email: user.email || "",
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setIsUpdating(true);
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ business_name: formData.businessName })
        .eq("id", user.id);
      
      if (error) throw error;
      
      toast.success("Profile updated", {
        description: "Your information has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Error updating profile", {
        description: "Please try again.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const initials = user?.email 
    ? user.email.substring(0, 2).toUpperCase() 
    : "US";

  return {
    user,
    isLoading,
    formData,
    isUpdating,
    handleChange,
    handleUpdateProfile,
    initials
  };
};
