
import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const useCases = [
  "Small business owners can create customer support bots",
  "Marketing teams can deploy product information assistants",
  "Support teams can create internal knowledge base assistants",
];

const AccessibleSection = () => {
  return (
    <section className="w-full py-20 md:py-28 lg:py-32 bg-background/80 backdrop-blur-sm border-t">
      <div className="container mx-auto max-w-6xl px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_500px] lg:gap-16 xl:grid-cols-[1fr_550px]">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="relative mx-auto aspect-square w-full max-w-[550px] overflow-hidden rounded-xl border bg-background p-2 shadow-xl sm:w-full lg:order-last"
          >
            <img
              src="/lovable-uploads/a156bad4-f430-4396-aa9a-0029e2a94346.png"
              width="550"
              height="550"
              alt="Dashboard preview"
              className="h-full w-full object-cover object-top rounded-lg"
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
  );
};

export default AccessibleSection;
