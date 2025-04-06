import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronDown, Play, Users, Zap } from "lucide-react";
import { motion } from "framer-motion";

interface HeroSectionProps {
  isScrolled: boolean;
  onVideoOpen: () => void;
}

const HeroSection = ({ isScrolled, onVideoOpen }: HeroSectionProps) => {
  const heroRef = useRef<HTMLDivElement>(null);

  return (
    <section
      ref={heroRef}
      className="w-full py-16 md:py-20 lg:py-24 xl:py-28 overflow-hidden relative"
      style={{ pointerEvents: "auto" }}
    >
      <div className="absolute inset-0 overflow-hidden" style={{ pointerEvents: "none" }}>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-purple-400/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_600px] lg:gap-16 xl:grid-cols-[1fr_700px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col justify-center space-y-6 text-left"
            style={{ pointerEvents: "auto" }}
          >
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium mb-4">
                  <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
                  <span>Launching at Lovable Hackathon</span>
                </div>
              </motion.div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl xl:text-6xl/none">
                Create Smart <span className="text-primary">AI Agents</span> From Your Documents <span className="text-primary">in Minutes</span>
              </h1>
              <p className="max-w-[600px] text-muted-foreground text-lg md:text-xl">
                Turn any document into an intelligent AI assistant{" "}
                <span className="font-bold text-primary">in just 1 minute</span> — no technical skills needed.
              </p>
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="flex flex-col gap-3 min-[400px]:flex-row"
            >
              <Button size="lg" className="gap-1 shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all" asChild>
                <Link to="/signup">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="group relative overflow-hidden flex gap-1" onClick={onVideoOpen}>
                <Play className="h-4 w-4" />
                <span className="relative z-10">Watch Video</span>
                <span className="absolute inset-0 bg-primary/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
              </Button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="flex items-center space-x-6 text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-primary" />
                <span>No technical skills needed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-primary" />
                <span>Deploy in minutes</span>
              </div>
            </motion.div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="flex items-center justify-center"
            style={{ pointerEvents: "auto" }}
          >
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="w-full max-w-[600px] rounded-xl shadow-2xl overflow-hidden"
            >
              <iframe 
                src="https://flashbot.lovable.app/widget/83bb2e5a-c785-4eb1-a67f-90aef2550553"
                width="100%" 
                height="500" 
                style={{ border: "none", borderRadius: "12px", pointerEvents: "auto" }}
                allow="microphone"
                title="AI Chat Widget"
              ></iframe>
              <div className="bg-muted/50 text-center py-2 text-sm text-muted-foreground">
                <span>⬆️ Ask me anything about Flashbot (try it now!)</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
      <div className="flex justify-center mt-16">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            delay: 1, 
            duration: 0.5, 
            repeat: Infinity, 
            repeatType: "reverse" 
          }}
        >
          <a
            href="#features"
            className="flex flex-col items-center text-muted-foreground hover:text-primary transition-colors"
          >
            <span className="text-xs font-medium mb-1">Explore Features</span>
            <ChevronDown className="h-5 w-5" />
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
