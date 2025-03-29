
import React from "react";
import { Settings } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface SettingsHeaderProps {
  title: string;
  description: string;
}

const SettingsHeader: React.FC<SettingsHeaderProps> = ({ title, description }) => {
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">{title}</h1>
          <p className="text-muted-foreground mt-1">{description}</p>
        </div>
        <Settings className="h-8 w-8 text-primary/60" />
      </div>
      <Separator className="my-6" />
    </>
  );
};

export default SettingsHeader;
