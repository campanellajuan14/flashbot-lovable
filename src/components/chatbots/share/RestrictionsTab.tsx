
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
        title: "Formato inválido",
        description: "Por favor ingresa un dominio válido (ejemplo: midominio.com)",
        variant: "destructive",
      });
      return;
    }
    
    // Check if domain already exists
    if (widgetConfig.restrictions?.allowed_domains?.includes(domain)) {
      toast({
        title: "Dominio duplicado",
        description: "Este dominio ya está en la lista",
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
        <Label htmlFor="allowed_domains" className="block mb-2">Dominios permitidos</Label>
        <p className="text-sm text-muted-foreground mb-4">
          Si no especificas ningún dominio, el widget funcionará en cualquier sitio web.
          Agrega dominios para restringir dónde se puede usar el widget.
        </p>
        
        <div className="flex gap-2 mb-4">
          <Input 
            id="allowed_domains" 
            placeholder="ejemplo.com"
            value={allowedDomain}
            onChange={(e) => setAllowedDomain(e.target.value)}
          />
          <Button onClick={addAllowedDomain}>Agregar</Button>
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
            No hay dominios restringidos
          </div>
        )}
      </div>
    </div>
  );
};

export default RestrictionsTab;
