
// Prompt generation utilities
import { ChatbotBehavior } from "../types.ts";

/**
 * Builds a system prompt based on chatbot behavior configuration
 */
export function buildSystemPrompt(chatbotName: string, behavior: ChatbotBehavior | undefined, documentContext: string, source: string | undefined) {
  let systemPrompt = `You are a chatbot named ${chatbotName}. `;
  
  if (behavior) {
    // Add tone instructions
    if (behavior.tone) {
      systemPrompt += `\nYou should respond in a ${behavior.tone} tone. `;
    }
    
    // Add style instructions
    if (behavior.style) {
      systemPrompt += `\nYour response style should be ${behavior.style}. `;
    }
    
    // Add language instructions
    if (behavior.language) {
      const languageMap: Record<string, string> = {
        'english': 'English',
        'spanish': 'Spanish',
        'french': 'French',
        'german': 'German',
        'chinese': 'Chinese',
        'japanese': 'Japanese'
      };
      
      const languageDisplay = languageMap[behavior.language] || behavior.language;
      systemPrompt += `\nYou must communicate in ${languageDisplay}. `;
    }
    
    // Add emoji usage instructions
    if (behavior.useEmojis) {
      systemPrompt += `\nUse emojis in your responses when appropriate. `;
    } else {
      systemPrompt += `\nDon't use emojis in your responses. `;
    }
    
    // Add asking questions instructions
    if (behavior.askQuestions) {
      systemPrompt += `\nAsk questions to better understand the user's needs. `;
    }
    
    // Add suggesting solutions instructions
    if (behavior.suggestSolutions) {
      systemPrompt += `\nAlways suggest practical solutions to the user's problems. `;
    }
    
    // Add custom instructions
    if (behavior.instructions) {
      systemPrompt += `\nAdditional instructions: ${behavior.instructions}`;
    }
    
    // Add greeting if available
    if (behavior.greeting) {
      systemPrompt += `\nYour initial greeting is: "${behavior.greeting}"`;
    }
  }

  // Improved instructions for using document context
  if (documentContext) {
    systemPrompt += `\n\nUse the following document information as context to answer the user's questions:

${documentContext}

Important instructions about using these documents:
1. Base your response primarily on these documents when they are relevant to the question.
2. If the information in the documents contradicts your general knowledge, prioritize the information from the documents.
3. If the question cannot be fully answered with the documents, supplement with your general knowledge, but clearly indicate when you are doing this.
4. Don't explicitly mention that you're using "documents" unless the user specifically asks about your sources.
5. If you quote information from the documents, do so naturally and fluidly in your response.
6. If you need to reference a specific document, you can refer to the content without mentioning that it is a document.`;
  }

  // Special instructions for WhatsApp
  if (source === 'whatsapp-webhook' || source === 'whatsapp_webhook') {
    systemPrompt += `\n\nIMPORTANT: You are responding to a WhatsApp message. Keep your responses concise and focused. 
    Avoid very long explanations as they don't display well on mobile. Break text into shorter paragraphs for readability.`;
  }

  console.log('System prompt:', systemPrompt);
  return systemPrompt;
}
