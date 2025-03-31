import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShareSettings } from "./types";
import { useToast } from "@/components/ui/use-toast";
import { Globe, ShieldCheck, XCircle, Plus, AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RestrictionsTabProps {
  widgetConfig: ShareSettings | null;
  setWidgetConfig: (config: ShareSettings) => void;
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addAllowedDomain();
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium flex items-center">
          <ShieldCheck className="mr-2 h-5 w-5 text-primary" />
          Domain Restrictions
        </h3>
        <p className="text-sm text-muted-foreground max-w-lg">
          Control where your widget can be used. By default, the widget can be embedded on any website.
          Add specific domains to restrict usage.
        </p>
      </div>
      
      <div className="p-5 border rounded-lg bg-muted/20">
        <Label htmlFor="allowed_domains" className="font-medium block mb-1">Add allowed domains</Label>
        <p className="text-sm text-muted-foreground mb-4">
          Enter domains without http/https or www (e.g., <span className="font-mono text-primary">example.com</span>)
        </p>
        
        <div className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Input 
              id="allowed_domains" 
              placeholder="example.com"
              value={allowedDomain}
              onChange={(e) => setAllowedDomain(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pr-10"
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-help text-muted-foreground">
                    <AlertCircle className="h-4 w-4" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-xs">Enter domain name without protocol (http/https) or www prefix</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Button 
            onClick={addAllowedDomain}
            className="gap-1"
            type="button"
          >
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
        
        {widgetConfig?.restrictions?.allowed_domains?.length > 0 ? (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Allowed domains</Label>
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
              {widgetConfig.restrictions.allowed_domains.map((domain, index) => (
                <div 
                  key={index} 
                  className="flex justify-between items-center p-3 bg-background rounded-md border border-border/50"
                >
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-sm">{domain}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10" 
                    onClick={() => removeDomain(domain)}
                    type="button"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center flex-col gap-3 p-8 border border-dashed rounded-md text-center">
            <Globe className="h-10 w-10 text-muted-foreground/50" />
            <div className="space-y-1">
              <h4 className="font-medium">No domain restrictions</h4>
              <p className="text-xs text-muted-foreground">Your widget can be used on any website</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
        <h4 className="text-sm font-medium flex items-center mb-2">
          <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
          Important Note
        </h4>
        <p className="text-xs text-muted-foreground">
          Domain restrictions are applied on the client side and can be bypassed by technical users.
          They are meant as a basic protection only.
        </p>
      </div>
    </div>
  );
};

export default RestrictionsTab;
