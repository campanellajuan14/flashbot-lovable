
import React from "react";
import { Zap } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center mb-4">
            <Zap className="h-6 w-6 text-primary mr-2" />
            <span className="text-xl font-bold">Flashbot</span>
          </div>
          <p className="text-center text-sm text-muted-foreground mb-2">
            Made by Fran Conejos at Lovable Hackaton
          </p>
          <div className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Flashbot. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
