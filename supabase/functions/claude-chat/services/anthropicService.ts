
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
    const errorData = await response.text();
    console.error('Anthropic API error:', errorData);
    throw new Error(`API error: ${response.status} ${errorData}`);
  }

  return await response.json();
}
