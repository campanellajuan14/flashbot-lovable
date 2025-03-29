
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";

const SampleDocumentDownload = () => {
  return (
    <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 mb-6 border-dashed">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5 text-primary" />
          Sample Hackathon Document
        </CardTitle>
        <CardDescription>
          Download the Lovable Hackathon documentation to test the knowledge base
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          This sample contains Lovable Hackathon documentation that you can use to test
          how the AI responds to questions about the hackathon rules, prizes, and requirements.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <a href="/sample-documents/hackaton_documentation.md" download="lovable_hackathon_documentation.md">
            <Button variant="outline" className="w-full sm:w-auto gap-2">
              <Download className="h-4 w-4" />
              Download Markdown
            </Button>
          </a>
          <a href="/sample-documents/hackaton_documentation.md" target="_blank" rel="noopener noreferrer">
            <Button variant="secondary" className="w-full sm:w-auto gap-2">
              <FileText className="h-4 w-4" />
              Preview
            </Button>
          </a>
        </div>
      </CardContent>
    </Card>
  );
};

export default SampleDocumentDownload;
