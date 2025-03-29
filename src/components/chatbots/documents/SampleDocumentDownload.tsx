
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
          <Button 
            variant="outline" 
            className="w-full sm:w-auto gap-2"
            onClick={() => {
              // Create a blob from the content to ensure it works even if the file doesn't exist
              const hackathonDoc = `# Lovable Hackaton Documentation

## Judging Criteria

Each project will be evaluated based on the following criteria, each worth 25% of the total score:

1. **Impact (25%)**  
   - Long-term success and scalability potential.  
   - Addresses a real problem in a meaningful way.  
   - Clear target audience and use case.  
   - Growth and monetization potential.

2. **Technical Implementation (25%)**  
   - Effective use of provided tools.  
   - Proper integrations with Lovable, Claude, Supabase, ElevenLabs, and Sentry.  
   - Required integrations functioning correctly.  
   - Application stability and lack of critical bugs.

3. **Creativity & Innovation (25%)**  
   - Unique and original concept.  
   - Novel approach to solving a problem.  
   - Unexpected or creative use of provided tools.  
   - Distinct from similar existing solutions.

4. **Pitch & Presentation (25%)**  
   - Clarity in showcasing value and impact.  
   - Quality of the demo and overall presentation.  
   - Well-defined problem statement and solution.  
   - Ability to answer questions and address feedback.`;

              const blob = new Blob([hackathonDoc], { type: 'text/markdown' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = 'lovable_hackathon_documentation.md';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
            }}
          >
            <Download className="h-4 w-4" />
            Download Markdown
          </Button>
          <Button 
            variant="secondary" 
            className="w-full sm:w-auto gap-2"
            onClick={() => {
              // Create a popup with the document content
              const hackathonDoc = `# Lovable Hackaton Documentation

## Judging Criteria

Each project will be evaluated based on the following criteria, each worth 25% of the total score:

1. **Impact (25%)**  
   - Long-term success and scalability potential.  
   - Addresses a real problem in a meaningful way.  
   - Clear target audience and use case.  
   - Growth and monetization potential.

2. **Technical Implementation (25%)**  
   - Effective use of provided tools.  
   - Proper integrations with Lovable, Claude, Supabase, ElevenLabs, and Sentry.  
   - Required integrations functioning correctly.  
   - Application stability and lack of critical bugs.

3. **Creativity & Innovation (25%)**  
   - Unique and original concept.  
   - Novel approach to solving a problem.  
   - Unexpected or creative use of provided tools.  
   - Distinct from similar existing solutions.

4. **Pitch & Presentation (25%)**  
   - Clarity in showcasing value and impact.  
   - Quality of the demo and overall presentation.  
   - Well-defined problem statement and solution.  
   - Ability to answer questions and address feedback.`;

              const previewWindow = window.open("", "_blank");
              if (previewWindow) {
                previewWindow.document.write(`
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <title>Lovable Hackathon Documentation Preview</title>
                    <style>
                      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto; }
                      h1, h2, h3 { color: #333; }
                      h1 { border-bottom: 1px solid #ddd; padding-bottom: 10px; }
                      h2 { margin-top: 30px; }
                      strong { font-weight: bold; }
                    </style>
                  </head>
                  <body>
                    <pre style="white-space: pre-wrap;">${hackathonDoc}</pre>
                  </body>
                  </html>
                `);
                previewWindow.document.close();
              }
            }}
          >
            <FileText className="h-4 w-4" />
            Preview
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SampleDocumentDownload;
