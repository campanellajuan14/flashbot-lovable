
import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MessageSquare, ArrowRight, FileText, Zap, Code, Users, BarChart, Bot, CheckCircle2, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

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
      <header
        className={`sticky top-0 z-40 w-full border-b backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-200 ${isScrolled ? "bg-background/95 shadow-sm" : "bg-transparent border-transparent"}`}
      >
        <div className="container mx-auto px-4 flex h-16 items-center justify-between">
          <div className="flex gap-2 items-center">
            <Zap className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Flashbot</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/auth/signin"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Login
            </Link>
            <Button size="sm" className="shadow-md hover:shadow-lg transition-all" asChild>
              <Link to="/chatbots/new">
                Create free bot
              </Link>
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-1">
        {/* Hero Section */}
        <section
          ref={heroRef}
          className="w-full py-12 md:py-16 lg:py-20 xl:py-24 bg-gradient-to-b from-background via-background to-muted/10 overflow-hidden relative"
        >
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute top-1/3 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto px-4">
            <div className="grid gap-8 lg:grid-cols-[1fr_600px] lg:gap-16 xl:grid-cols-[1fr_700px]">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex flex-col justify-center space-y-6 text-left"
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
                    Create Smart AI Agents From <span className="text-primary">Your Documents</span> in Minutes
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
                    <Link to="/auth/signup">
                      Get Started <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="group relative overflow-hidden" asChild>
                    <Link to="/docs">
                      <span className="relative z-10">Learn More</span>
                      <span className="absolute inset-0 bg-primary/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
                    </Link>
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
              >
                {/* Flashbot Widget - Live Demo */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="w-full max-w-[600px] rounded-xl shadow-2xl overflow-hidden"
                >
                  <iframe 
                    src="https://flashbot.lovable.app/widget/83bb2e5a-c785-4eb1-a67f-90aef2550553"
                    width="100%" 
                    height="600" 
                    style={{ border: "none", borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}
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
          <div className="flex justify-center mt-12">
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

        {/* Features Section */}
        <section id="features" className="w-full py-20 md:py-28 lg:py-32 bg-background relative">
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none"></div>
          <div className="container mx-auto max-w-6xl px-4">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
                className="space-y-2"
              >
                <div className="inline-block rounded-lg bg-primary px-3 py-1 text-sm text-primary-foreground">
                  Key Features
                </div>
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">Why Flashbot Stands Out</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Unlock the power of your organization's knowledge with our unique approach to AI chatbots
                </p>
              </motion.div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-8 py-12 md:grid-cols-2 lg:grid-cols-3 lg:gap-12">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="group flex flex-col items-start space-y-4 rounded-xl border p-6 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {feature.icon}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Templates Section */}
        <section id="templates" className="w-full py-20 md:py-28 lg:py-32 bg-muted relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 -left-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>

          <div className="container mx-auto max-w-6xl px-4 relative">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
                className="space-y-2"
              >
                <div className="inline-block rounded-lg bg-primary px-3 py-1 text-sm text-primary-foreground">
                  Ready-to-Use Templates
                </div>
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                  Jumpstart with Pre-Built Templates
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Choose from our library of templates designed for specific use cases and customize them to your needs
                </p>
              </motion.div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-8 py-12 md:grid-cols-3 lg:gap-12">
              {templates.map((template, index) => (
                <motion.div
                  key={template.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="flex flex-col items-start space-y-4 rounded-xl border bg-background p-6 shadow-md hover:shadow-lg transition-all"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {template.icon}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold">{template.title}</h3>
                    <p className="text-muted-foreground">{template.description}</p>
                    <ul className="space-y-1 pt-2">
                      {template.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section - Improved without the line */}
        <section id="how-it-works" className="w-full py-20 md:py-28 lg:py-32 bg-background">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
                className="space-y-2"
              >
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">How Flashbot Works</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Three simple steps to create your own AI-powered chatbot
                </p>
              </motion.div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 py-12 md:grid-cols-3 lg:gap-16 relative">
              {steps.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="flex flex-col items-center space-y-4 text-center relative"
                >
                  <motion.div
                    initial={{ scale: 0.8 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ delay: index * 0.1 + 0.2, duration: 0.5, type: "spring" }}
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold relative z-10"
                  >
                    {index + 1}
                  </motion.div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Dashboard Preview Section */}
        <section className="w-full py-20 md:py-28 lg:py-32 bg-background border-t">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="grid gap-8 lg:grid-cols-[1fr_500px] lg:gap-16 xl:grid-cols-[1fr_550px]">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
                className="relative mx-auto aspect-square w-full max-w-[550px] overflow-hidden rounded-xl border bg-background p-2 shadow-xl sm:w-full lg:order-last"
              >
                <img
                  src="/placeholder.svg"
                  width="550"
                  height="550"
                  alt="Dashboard preview"
                  className="h-full w-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4 rounded-lg bg-background/80 backdrop-blur-sm p-4 shadow-lg">
                  <h4 className="text-lg font-semibold mb-1">Intuitive Dashboard</h4>
                  <p className="text-sm text-muted-foreground">
                    Manage all your chatbots from a single, user-friendly interface
                  </p>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
                className="flex flex-col justify-center space-y-6"
              >
                <div className="space-y-2">
                  <div className="inline-block rounded-lg bg-primary px-3 py-1 text-sm text-primary-foreground">
                    For Everyone
                  </div>
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                    No Technical Skills Required
                  </h2>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    Flashbot democratizes AI technology, making it accessible to everyone regardless of technical
                    background.
                  </p>
                </div>
                <ul className="grid gap-3 py-4">
                  {useCases.map((useCase, index) => (
                    <motion.li
                      key={useCase}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                      className="flex items-center gap-3"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      </div>
                      <span>{useCase}</span>
                    </motion.li>
                  ))}
                </ul>
                <div className="flex flex-col gap-3 min-[400px]:flex-row">
                  <Button size="lg" className="gap-1 shadow-md hover:shadow-lg hover:translate-y-[-2px] transition-all" asChild>
                    <Link to="/auth/signup">
                      Start Building <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-20 md:py-28 lg:py-32 bg-primary text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 -left-40 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
          </div>

          <div className="container mx-auto max-w-6xl px-4 relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center justify-center space-y-6 text-center"
            >
              <div className="space-y-3">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight lg:text-5xl">
                  Ready to have your intelligent chatbot in just 1 minute?
                </h2>
                <p className="max-w-[900px] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Transform your documents into powerful virtual assistants and start automating your customer service
                  today
                </p>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="flex flex-col gap-3 min-[400px]:flex-row"
              >
                <Button
                  size="lg"
                  variant="secondary"
                  className="gap-1 shadow-md hover:shadow-lg hover:translate-y-[-2px] transition-all"
                  asChild
                >
                  <Link to="/auth/signup">
                    Get Started Now <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>
      
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
    </div>
  );
};

// Data
const features = [
  {
    icon: <FileText className="h-6 w-6" />,
    title: "Document Intelligence",
    description:
      "Upload PDFs, TXT, or CSV files and Flashbot instantly understands and can answer questions about them.",
  },
  {
    icon: <Code className="h-6 w-6" />,
    title: "No-Code Platform",
    description: "Create, customize, and deploy your AI chatbot without writing a single line of code.",
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Instant Deployment",
    description: "Get your chatbot live on your website in minutes with our simple JavaScript widget.",
  },
  {
    icon: <Bot className="h-6 w-6" />,
    title: "Brand Customization",
    description: "Tailor your chatbot's appearance to match your brand's colors and style.",
  },
  {
    icon: <BarChart className="h-6 w-6" />,
    title: "Analytics Dashboard",
    description: "Track performance and gain insights from user interactions with your chatbot.",
  },
  {
    icon: <MessageSquare className="h-6 w-6" />,
    title: "Ready-to-Use Templates",
    description: "Choose from multiple templates for different use cases and customize them to your needs.",
  },
];

const templates = [
  {
    icon: <MessageSquare className="h-6 w-6" />,
    title: "Customer Support",
    description:
      "Answer FAQs, troubleshoot issues, and handle returns or refunds automatically with a support chatbot trained on your policies.",
    features: ["Pre-configured for common support questions", "Customizable escalation paths"],
  },
  {
    icon: <Code className="h-6 w-6" />,
    title: "Product Expert",
    description:
      "Create a virtual product specialist that can answer detailed questions about your offerings, specifications, and comparisons.",
    features: ["Optimized for product catalogs", "Includes recommendation capabilities"],
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: "Internal Knowledge Base",
    description:
      "Build an assistant for your team that can instantly retrieve information from internal documentation, policies, and procedures.",
    features: ["Secure access controls", "Optimized for company wikis and guides"],
  },
];

const steps = [
  {
    title: "Upload Documents",
    description: "Simply upload your PDFs, text files, or other documents containing your knowledge base.",
  },
  {
    title: "Customize Your Bot",
    description: "Personalize the appearance and behavior of your chatbot to match your brand.",
  },
  {
    title: "Deploy & Engage",
    description: "Add the widget to your website with a simple code snippet and start engaging with users.",
  },
];

const useCases = [
  "Small business owners can create customer support bots",
  "Marketing teams can deploy product information assistants",
  "Support teams can create internal knowledge base assistants",
];

export default Index;
