
// Service for communicating with Anthropic API
import { ANTHROPIC_API_KEY, ANTHROPIC_API_URL } from "../config.ts";
import { Message } from "../types.ts";

/**
 * Send a request to the Anthropic API
 */
export async function callAnthropicAPI(
  formattedMessages: Message[], 
  systemPrompt: string,
  model: string,
  maxTokens: number,
  temperature: number
) {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: formattedMessages,
        system: systemPrompt,
        max_tokens: maxTokens,
        temperature: temperature,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', errorText);
      
      try {
        // Intentar analizar como JSON para obtener detalles específicos del error
        const errorData = JSON.parse(errorText);
        
        // Detectar errores específicos para mejor manejo
        if (errorData?.error?.type === 'overloaded_error') {
          throw new Error(`Anthropic API overloaded: ${errorText}`);
        }
        
        if (response.status === 429) {
          throw new Error(`Rate limit exceeded: ${errorText}`);
        }
        
        throw new Error(`API error: ${response.status} ${errorText}`);
      } catch (parseError) {
        // Si no es JSON, usar el texto directamente
        throw new Error(`API error: ${response.status} ${errorText}`);
      }
    }

    return await response.json();
  } catch (error) {
    console.error('Error calling Anthropic API:', error);
    throw error;
  }
}
