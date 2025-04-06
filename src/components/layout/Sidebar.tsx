
import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { 
  Dices, 
  MessageSquare, 
  Settings, 
  BarChart,
  FileText,
  MessagesSquare,
  Menu,
  ChevronLeft,
  Phone
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useAuth();
  
  const navItems = [
    { 
      label: "Chatbots", 
      icon: <MessageSquare className="h-5 w-5" />, 
      href: "/chatbots" 
    },
    { 
      label: "Conversaciones",
      icon: <MessagesSquare className="h-5 w-5" />,
      href: "/conversations"
    },
    { 
      label: "Documentos",
      icon: <FileText className="h-5 w-5" />,
      href: "/documents"
    },
    { 
      label: "Estadísticas", 
      icon: <BarChart className="h-5 w-5" />, 
      href: "/analytics" 
    },
    { 
      label: "Configuración", 
      icon: <Settings className="h-5 w-5" />, 
      href: "/settings" 
    },
    { 
      label: "WhatsApp", 
      icon: <Phone className="h-5 w-5" />, 
      href: "/settings/whatsapp" 
    }
  ];
  
  if (!user) return null;
  
  return (
    <div className={cn("border-r bg-background relative flex flex-col min-h-screen", className)}>
      <div className="absolute right-[-12px] top-4 hidden md:flex">
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="rounded-full bg-background border h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          {isCollapsed ? <Menu size={12} /> : <ChevronLeft size={12} />}
        </button>
      </div>
      
      <div className={cn(
        "flex items-center h-16 border-b px-4",
        isCollapsed ? "justify-center" : "justify-between"
      )}>
        <div className="flex items-center justify-center">
          <Dices className="h-6 w-6 text-primary" />
        </div>
      </div>
      
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid gap-1 px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) => 
                cn(
                  "flex items-center gap-3 px-3 py-2 text-sm rounded-md",
                  "hover:bg-accent hover:text-accent-foreground transition-colors",
                  isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                  isCollapsed ? "justify-center" : ""
                )
              }
              title={isCollapsed ? item.label : undefined}
            >
              {item.icon}
              {!isCollapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
