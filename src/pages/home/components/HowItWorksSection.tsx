
import React from "react";
import { motion } from "framer-motion";

// Steps data
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

const HowItWorksSection = () => {
  return (
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
  );
};

export default HowItWorksSection;
