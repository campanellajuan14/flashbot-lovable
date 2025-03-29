
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShareSettings } from "./types";
import { useToast } from "@/components/ui/use-toast";

interface RestrictionsTabProps {
  widgetConfig: ShareSettings | null;
  setWidgetConfig: React.Dispatch<React.SetStateAction<ShareSettings | null>>;
}

const RestrictionsTab: React.FC<RestrictionsTabProps> = ({ widgetConfig, setWidgetConfig }) => {
  const [allowedDomain, setAllowedDomain] = useState("");
  const { toast } = useToast();
  
  if (!widgetConfig) return null;

  const addAllowedDomain = () => {
    if (!allowedDomain || !widgetConfig) return;
    
    const domain = allowedDomain.trim().toLowerCase();
    if (domain === "") return;
    
    // Validate domain format (basic check)
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/;
    if (!domainRegex.test(domain)) {
      toast({
        title: "Invalid format",
        description: "Please enter a valid domain (example: mydomain.com)",
        variant: "destructive",
      });
      return;
    }
    
    // Check if domain already exists
    if (widgetConfig.restrictions?.allowed_domains?.includes(domain)) {
      toast({
        title: "Duplicate domain",
        description: "This domain is already in the list",
        variant: "destructive",
      });
      return;
    }
    
    // Add domain to list
    const newConfig = { ...widgetConfig };
    if (!newConfig.restrictions) newConfig.restrictions = {};
    if (!newConfig.restrictions.allowed_domains) newConfig.restrictions.allowed_domains = [];
    
    newConfig.restrictions.allowed_domains.push(domain);
    setWidgetConfig(newConfig);
    setAllowedDomain("");
  };

  const removeDomain = (domain: string) => {
    if (!widgetConfig?.restrictions?.allowed_domains) return;
    
    const newConfig = { ...widgetConfig };
    newConfig.restrictions.allowed_domains = newConfig.restrictions.allowed_domains.filter(d => d !== domain);
    setWidgetConfig(newConfig);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="allowed_domains" className="block mb-2">Allowed domains</Label>
        <p className="text-sm text-muted-foreground mb-4">
          If you don't specify any domains, the widget will work on any website.
          Add domains to restrict where the widget can be used.
        </p>
        
        <div className="flex gap-2 mb-4">
          <Input 
            id="allowed_domains" 
            placeholder="example.com"
            value={allowedDomain}
            onChange={(e) => setAllowedDomain(e.target.value)}
          />
          <Button onClick={addAllowedDomain}>Add</Button>
        </div>
        
        {widgetConfig?.restrictions?.allowed_domains?.length ? (
          <div className="space-y-2">
            {widgetConfig.restrictions.allowed_domains.map((domain, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                <span>{domain}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0" 
                  onClick={() => removeDomain(domain)}
                >
                  &times;
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground p-4 border border-dashed rounded-md text-center">
            No restricted domains
          </div>
        )}
      </div>
    </div>
  );
};

export default RestrictionsTab;
