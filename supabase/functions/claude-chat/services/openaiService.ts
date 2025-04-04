
// Service for communicating with OpenAI API - Fallback for when Claude is overloaded
import { OPENAI_API_KEY } from "../config.ts";
import { Message } from "../types.ts";

/**
 * Send a request to the OpenAI API as a fallback
 */
export async function callOpenAIAPI(
  formattedMessages: Message[], 
  systemPrompt: string,
  model = "gpt-4o-mini",
  maxTokens = 1000,
  temperature = 0.7
) {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  try {
    // Prepare messages for OpenAI format
    const openaiMessages = [
      { role: "system", content: systemPrompt },
      ...formattedMessages
    ];

    console.log(`Calling OpenAI API with model ${model}`);
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: openaiMessages,
        max_tokens: maxTokens,
        temperature: temperature,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    const responseData = await response.json();
    console.log('OpenAI API response received successfully');
    
    // Adapt response to match Anthropic format for compatibility
    return {
      model: responseData.model,
      content: [
        { 
          text: responseData.choices[0]?.message?.content || ""
        }
      ],
      usage: {
        input_tokens: responseData.usage?.prompt_tokens || 0,
        output_tokens: responseData.usage?.completion_tokens || 0
      }
    };
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw error;
  }
}
