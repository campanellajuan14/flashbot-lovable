
import React, { useState, useEffect } from "react";
import HomeHeader from "./components/HomeHeader";
import HeroSection from "./components/HeroSection";
import FeaturesSection from "./components/FeaturesSection";
import TemplatesSection from "./components/TemplatesSection";
import HowItWorksSection from "./components/HowItWorksSection";
import DashboardPreviewSection from "./components/DashboardPreviewSection";
import CTASection from "./components/CTASection";
import Footer from "./components/Footer";

const Index = () => {
  const [isScrolled, setIsScrolled] = useState(false);

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
      <HomeHeader isScrolled={isScrolled} />
      
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <TemplatesSection />
        <HowItWorksSection />
        <DashboardPreviewSection />
        <CTASection />
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
