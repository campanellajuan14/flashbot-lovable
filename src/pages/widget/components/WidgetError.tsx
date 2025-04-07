import React from "react";
import { AlertCircle, Bug, Server, Smartphone, Lock } from "lucide-react";

interface WidgetErrorProps {
  error: string | null;
  details?: string | null;
  allowedDomains?: string[];
}

const WidgetError: React.FC<WidgetErrorProps> = ({ error, details, allowedDomains }) => {
  // Log the error for debugging
  console.error("[WidgetError] Displaying error:", error, details);
  
  // Create a diagnostic ID for troubleshooting
  const diagnosticId = `widget-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
  
  // Get basic diagnostic info
  const diagnosticInfo = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    widgetId: window.location.pathname.split('/').pop() || 'Not found',
    referrer: document.referrer || 'None',
    userAgent: navigator.userAgent,
    screenSize: `${window.innerWidth}x${window.innerHeight}`,
    hostname: window.location.hostname,
    protocol: window.location.protocol,
    ancestorOrigins: Array.from(document.location.ancestorOrigins || []),
    diagnosticId
  };
  
  // Log diagnostic information 
  console.error("[WidgetError] Diagnostic information:", diagnosticInfo);
  
  // Check the type of error to show appropriate messaging
  const isDomainError = error?.toLowerCase().includes('domain') || allowedDomains?.length;
  const isWidgetNotFound = error?.toLowerCase().includes('not found') || error?.toLowerCase().includes('no encontrado');
  
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-background text-muted-foreground p-4 text-center gap-3">
      {isDomainError ? (
        <Lock className="h-10 w-10 text-amber-500" />
      ) : (
        <AlertCircle className="h-10 w-10 text-destructive" />
      )}
      
      <h3 className="text-lg font-medium">{
        isDomainError 
          ? "Dominio no autorizado" 
          : isWidgetNotFound 
            ? "ID del widget no encontrado" 
            : "Error del widget"
      }</h3>
      
      <p className="max-w-md">
        {error || (
          isWidgetNotFound 
            ? "No se pudo encontrar el widget con el ID proporcionado."
            : "Error cargando la configuración del widget"
        )}
      </p>
      
      {details && <p className="text-xs text-muted-foreground max-w-md">{details}</p>}
      
      {isDomainError && allowedDomains && allowedDomains.length > 0 && (
        <div className="max-w-md bg-muted/30 p-3 rounded-md mt-2">
          <p className="text-sm font-medium mb-1">Este widget solo puede usarse en:</p>
          <ul className="text-xs space-y-1">
            {allowedDomains.map((domain, i) => (
              <li key={i} className="font-mono bg-muted/50 rounded px-2 py-1">{domain}</li>
            ))}
          </ul>
          <p className="text-xs mt-3">
            Para usar este widget en otros dominios, contacta al propietario para actualizar la configuración.
          </p>
        </div>
      )}
      
      <div className="text-xs text-muted-foreground mt-4 p-2 bg-muted/20 rounded max-w-xs overflow-auto">
        <div className="flex items-center mb-1">
          <Bug className="h-3 w-3 mr-1" />
          <p className="font-semibold">Info de diagnóstico:</p>
        </div>
        <div className="grid grid-cols-[auto_1fr] gap-x-2 text-left">
          <span className="text-muted">ID:</span>
          <span className="font-mono">{diagnosticId}</span>
          
          <span className="text-muted">Widget ID:</span>
          <span className="font-mono truncate">{diagnosticInfo.widgetId}</span>
          
          <span className="text-muted">Dominio:</span>
          <span className="font-mono truncate">{diagnosticInfo.hostname}</span>
          
          <span className="text-muted">Referrer:</span>
          <span className="truncate">{diagnosticInfo.referrer || 'Ninguno'}</span>
        </div>
        
        <button 
          onClick={() => {
            console.log("Full diagnostics:", diagnosticInfo);
            if (window.widgetDiagnostics) {
              console.log("Widget event history:", window.widgetDiagnostics.events);
            }
            alert("Información de diagnóstico enviada a la consola");
          }}
          className="mt-2 p-1 bg-muted hover:bg-muted/80 rounded text-xs w-full flex items-center justify-center"
        >
          <Server className="h-3 w-3 mr-1" /> Mostrar diagnóstico completo
        </button>
      </div>
    </div>
  );
};

export default WidgetError;
