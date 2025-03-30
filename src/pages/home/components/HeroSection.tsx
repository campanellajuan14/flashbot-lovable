
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative py-24 overflow-hidden bg-background">
      <div className="container px-4 md:px-6">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-8 xl:grid-cols-[1fr_1fr] items-center">
          <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
                Chatbots powered by AI
              </h1>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Create and deploy your own AI chatbots with your own data in minutes.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Link to="/auth/signup">
                <Button size="lg" className="h-11 px-8">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/auth/signin">
                <Button size="lg" variant="outline" className="h-11 px-8">
                  Log In
                </Button>
              </Link>
            </div>
          </div>
          <div className="mx-auto flex w-full items-center justify-center">
            <div className="w-full overflow-hidden rounded-lg border bg-background shadow-xl">
              <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-2">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500"></div>
                  <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                </div>
                <div className="text-xs text-muted-foreground">Live Demo</div>
                <div className="w-16"></div>
              </div>
              <div className="relative h-[500px] w-full p-0 overflow-hidden">
                <iframe 
                  src="https://flashbot.lovable.app/widget/387d9841-f59d-418b-b7b6-113012ef5a72"
                  width="100%" 
                  height="100%" 
                  style={{ border: 'none', borderRadius: '0', boxShadow: 'none' }}
                  allow="microphone"
                  title="AI Chat Widget"
                  className="absolute inset-0 w-full h-full"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
