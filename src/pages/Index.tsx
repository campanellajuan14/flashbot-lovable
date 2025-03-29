
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, ArrowRight, Database, Bot, Code, CheckCircle2 } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 px-4 bg-gradient-to-b from-white to-accent/40 dark:from-background dark:to-accent/10">
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col md:flex-row items-center">
              <div className="flex-1 space-y-6 mb-8 md:mb-0 md:pr-12">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold">
                  Build smarter AI chatbots with your data
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl">
                  ChatSimp helps you create AI-powered chatbots trained on your documents, knowledge base, and FAQs in minutes, not weeks.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button size="lg" asChild>
                    <Link to="/sign-up">
                      Get Started Free
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link to="/docs">
                      View Documentation
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="flex-1 max-w-xl">
                <Card className="border-2 shadow-lg">
                  <CardHeader className="bg-primary text-primary-foreground rounded-t-lg space-y-1">
                    <div className="flex items-center">
                      <Bot className="h-5 w-5 mr-2" />
                      <span className="font-medium">ChatSimp Assistant</span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div className="chat-bubble-bot ml-0">
                      Hello! I'm your AI assistant powered by ChatSimp. How can I help you today?
                    </div>
                    <div className="chat-bubble-user mr-0">
                      What makes ChatSimp different from other chatbot platforms?
                    </div>
                    <div className="chat-bubble-bot ml-0">
                      ChatSimp stands out with its powerful document-based knowledge system. You can easily upload your documents, and our AI will automatically understand and reference them to provide accurate answers based on your specific content. It's also incredibly easy to set up - no coding required!
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <div className="inline-flex items-center bg-secondary rounded-full px-2 py-1">
                        <Database className="h-3 w-3 mr-1" />
                        Product Comparison
                      </div>
                      <div className="inline-flex items-center bg-secondary rounded-full px-2 py-1">
                        <Database className="h-3 w-3 mr-1" />
                        Features List
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Powerful Features, Simple Interface
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Create, customize, and deploy AI chatbots with zero technical skills required.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Database,
                  title: "Document Understanding",
                  description: "Upload PDFs, CSVs, or text documents and let the AI understand and reference them automatically."
                },
                {
                  icon: MessageSquare,
                  title: "Easy Customization",
                  description: "Customize your chatbot's personality, tone, and behavior with a simple interface."
                },
                {
                  icon: Code,
                  title: "Embeddable Widget",
                  description: "Add your chatbot to any website with a simple copy-paste widget code."
                },
                {
                  icon: Bot,
                  title: "AI-Powered Responses",
                  description: "Leverage advanced language models to provide accurate and helpful responses."
                },
                {
                  icon: CheckCircle2,
                  title: "No Coding Required",
                  description: "Create and deploy sophisticated chatbots without writing a single line of code."
                },
                {
                  icon: MessageSquare,
                  title: "Analytics & Insights",
                  description: "Track performance and gather insights to continuously improve your chatbot."
                }
              ].map((feature, i) => (
                <Card key={i} className="dashboard-card">
                  <CardContent className="pt-6">
                    <feature.icon className="h-12 w-12 text-primary mb-4" />
                    <CardTitle className="mb-2">{feature.title}</CardTitle>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-20 px-4 bg-accent">
          <div className="container mx-auto max-w-6xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to transform your customer support?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Create your first AI chatbot in minutes and start providing 24/7 support to your customers.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button size="lg" asChild>
                <Link to="/sign-up">
                  Get Started Free
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/sign-in">
                  Sign In
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <MessageSquare className="h-6 w-6 text-primary mr-2" />
              <span className="text-xl font-bold">ChatSimp</span>
            </div>
            <div className="flex flex-wrap gap-6">
              <Link to="/about" className="text-muted-foreground hover:text-foreground">About</Link>
              <Link to="/docs" className="text-muted-foreground hover:text-foreground">Documentation</Link>
              <Link to="/pricing" className="text-muted-foreground hover:text-foreground">Pricing</Link>
              <Link to="/blog" className="text-muted-foreground hover:text-foreground">Blog</Link>
              <Link to="/contact" className="text-muted-foreground hover:text-foreground">Contact</Link>
            </div>
          </div>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} ChatSimp. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
