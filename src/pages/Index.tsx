
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

// Import components
import HeaderSection from "@/components/home/HeaderSection";
import HeroSection from "@/components/home/HeroSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import TemplatesSection from "@/components/home/TemplatesSection";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import AccessibleSection from "@/components/home/AccessibleSection";
import CTASection from "@/components/home/CTASection";
import FooterSection from "@/components/home/FooterSection";
import VideoDialog from "@/components/home/VideoDialog";

const Index = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="fixed inset-0 bg-gradient-to-br from-purple-50 via-background to-purple-50/30 dark:from-purple-900/20 dark:via-background dark:to-purple-900/10 pointer-events-none z-0"></div>
      
      <HeaderSection isScrolled={isScrolled} />
      
      <main className="flex-1 relative z-10">
        <HeroSection isScrolled={isScrolled} onVideoOpen={() => setVideoOpen(true)} />
        <FeaturesSection />
        <TemplatesSection />
        <HowItWorksSection />
        <AccessibleSection />
        <CTASection />
      </main>
      
      <FooterSection />

      {/* YouTube Video Dialog */}
      <VideoDialog 
        isOpen={videoOpen} 
        onOpenChange={setVideoOpen} 
        videoId="Nbd9pcuLVWA"
      />
    </div>
  );
};

export default Index;
