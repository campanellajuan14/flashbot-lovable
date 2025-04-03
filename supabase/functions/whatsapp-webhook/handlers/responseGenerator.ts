
/**
 * Generate a response from the chatbot using Claude or GPT model
 */
export async function generateChatbotResponse(
  supabase: any,
  chatbotId: string,
  conversationId: string,
  userMessage: string,
  chatbot: any
) {
  console.log(`Generating response for chatbot ${chatbotId}, conversation ${conversationId}`);
  
  try {
    // Determine which model to use based on chatbot configuration
    const model = chatbot?.settings?.model || 'gpt-4o';
    const isAnthropic = model.includes('claude');
    
    console.log(`Using model: ${model}, isAnthropic: ${isAnthropic}`);
    
    // Prepare system message including behavior settings
    const systemMessage = `${chatbot.behavior?.tone || 'You are a professional and friendly assistant.'} ${chatbot.behavior?.instructions || ''}`;
    console.log(`System message: "${systemMessage.substring(0, 100)}..."`);
    
    // Invoke claude-chat function
    const functionName = 'claude-chat';
    
    // Prepare messages for the chat
    const messages = [
      // System message
      {
        role: 'system',
        content: systemMessage
      },
      // User message
      { 
        role: 'user', 
        content: userMessage 
      }
    ];
    
    console.log(`Invoking edge function: ${functionName} with payload:`, JSON.stringify({
      messages: messages,
      model: model,
      chatbotId: chatbotId,
      conversationId: conversationId,
      source: 'whatsapp-webhook'
    }, null, 2));
    
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: {
        messages: messages,
        chatbotId: chatbotId,
        conversationId: conversationId,
        source: 'whatsapp-webhook',
        settings: chatbot.settings || {}
      },
    });
    
    if (error) {
      console.error("Error invoking edge function:", error);
      throw error;
    }
    
    console.log("Claude-chat function response:", JSON.stringify(data));
    
    if (!data || !data.message) {
      console.error("No response data returned from function");
      return "Lo siento, tuve un problema procesando tu mensaje. Por favor, intenta de nuevo más tarde.";
    }
    
    console.log(`Response generated successfully with length: ${data.message.length || 0}`);
    console.log(`Response preview: ${data.message.substring(0, 100) || "No response"}`);
    
    return data.message;
  } catch (error) {
    console.error("Error generating response:", error);
    return "Lo siento, tuve un problema procesando tu mensaje. Por favor, intenta de nuevo más tarde.";
  }
}
