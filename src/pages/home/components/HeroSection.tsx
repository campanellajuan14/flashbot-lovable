
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
            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-sm font-medium transition-colors bg-muted">
              <span className="bg-primary rounded-full w-2 h-2 mr-1"></span>
              Launching at Lovable Hackathon
            </div>
            <div className="space-y-2">
              <h1 className="text-5xl font-bold tracking-tighter sm:text-6xl md:text-7xl">
                Create Smart AI Agents 
                <span className="text-primary block">From Your Documents</span>
                <span className="block">in Minutes</span>
              </h1>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Turn any document into an intelligent AI assistant 
                <span className="text-primary font-medium"> in just 1 minute </span>
                — no technical skills needed.
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
                  Learn More
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-background p-1 border">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-primary">
                    <circle cx="12" cy="6" r="4"></circle>
                    <path d="M20 17.5c0 2.485 0 4.5-8 4.5s-8-2.015-8-4.5S7.582 13 12 13s8 2.015 8 4.5Z"></path>
                  </svg>
                </div>
                <span className="text-sm text-muted-foreground">
                  No technical skills needed
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-background p-1 border">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-primary">
                    <path d="m13 2-2 2.5h3L12 7"></path>
                    <path d="M10 9v10.5L16 22"></path>
                    <path d="m11 13.5 5 3.5"></path>
                    <path d="M10 19.5 7 21"></path>
                    <path d="m2 5 8 4"></path>
                    <path d="m18 8 4-2"></path>
                    <path d="m6 11 8-5"></path>
                    <path d="M17 11v4"></path>
                    <path d="m3 14 8-2.5"></path>
                    <path d="m6 17 8-2.5"></path>
                    <path d="m17 17 4-1"></path>
                  </svg>
                </div>
                <span className="text-sm text-muted-foreground">
                  Deploy in minutes
                </span>
              </div>
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
