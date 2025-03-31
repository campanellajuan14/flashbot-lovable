
import React from "react";
import { Zap } from "lucide-react";

interface WidgetBrandingProps {
  showBranding?: boolean;
}

const WidgetBranding: React.FC<WidgetBrandingProps> = ({ showBranding }) => {
  if (!showBranding) return null;
  
  return (
    <div 
      className="p-2 text-center text-xs" 
      style={{ borderTop: '1px solid rgba(0,0,0,0.1)', color: '#999' }}
    >
      <a 
        href="https://flashbot.com" 
        target="_blank" 
        rel="noopener noreferrer"
        style={{ color: '#999', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
      >
        <Zap className="h-3 w-3" />
        Powered by Flashbot
      </a>
    </div>
  );
};

export default WidgetBranding;
