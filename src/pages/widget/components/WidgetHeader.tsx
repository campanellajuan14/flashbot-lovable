
import React from "react";
import { X } from "lucide-react";

interface WidgetHeaderProps {
  title?: string;
  subtitle?: string;
  primaryColor?: string;
}

const WidgetHeader: React.FC<WidgetHeaderProps> = ({ 
  title = 'Chat',
  subtitle,
  primaryColor = '#2563eb'
}) => {
  return (
    <div className="p-4" style={{ backgroundColor: primaryColor, color: '#ffffff' }}>
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-medium">{title}</h3>
          {subtitle && <p className="text-sm opacity-90">{subtitle}</p>}
        </div>
        <button className="text-white/80 hover:text-white transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default WidgetHeader;
