
import React from "react";
import { MessageSquare, Code, Users, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

// Template data
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

const TemplatesSection = () => {
  return (
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
              className="flex flex-col items-start space-y-4 rounded-xl border bg-background p-6 shadow-md hover:shadow-lg transition-all text-left"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {template.icon}
              </div>
              <div className="space-y-2 w-full">
                <h3 className="text-xl font-bold">{template.title}</h3>
                <p className="text-muted-foreground">{template.description}</p>
                <ul className="space-y-1 pt-2">
                  {template.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
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
  );
};

export default TemplatesSection;
