
import React from "react";
import { motion } from "framer-motion";
import { MessageSquare, FileText, Code, Zap, Bot, BarChart } from "lucide-react";

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

const FeaturesSection = () => {
  return (
    <section id="features" className="w-full py-20 md:py-28 lg:py-32 bg-background/80 backdrop-blur-sm relative">
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none"></div>
      <div className="container mx-auto max-w-6xl px-6 lg:px-8">
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
  );
};

export default FeaturesSection;
