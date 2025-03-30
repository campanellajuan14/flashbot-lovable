
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Zap, 
  FileText, 
  Settings, 
  BarChart,
  MessageSquare
} from "lucide-react";

const Sidebar = () => {
  const location = useLocation();
  
  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Chatbots",
      href: "/chatbots",
      icon: Zap,
    },
    {
      title: "Conversaciones",
      href: "/conversations",
      icon: MessageSquare,
      description: "Ver las conversaciones de tus chatbots"
    },
    {
      title: "Documentos",
      href: "/documents",
      icon: FileText,
      description: "Gestionar los documentos de tus chatbots"
    },
    {
      title: "Analytics",
      href: "/analytics",
      icon: BarChart,
    },
    {
      title: "Settings",
      href: "/settings",
      icon: Settings,
    },
  ];

  return (
    <div className="w-64 border-r bg-sidebar shadow-sm">
      <div className="h-full py-4">
        <nav className="space-y-1 px-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                location.pathname === item.href || 
                (item.href !== "/dashboard" && location.pathname.startsWith(item.href))
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
              title={item.description}
            >
              <item.icon className="h-5 w-5" />
              {item.title}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
