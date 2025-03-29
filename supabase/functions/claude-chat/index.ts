
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, behavior, chatbotName, settings } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Invalid request: messages array is required');
    }

    console.log('Received request with messages:', messages);
    console.log('Behavior settings:', behavior);
    console.log('Model settings:', settings);

    // Configuraciones predeterminadas si no se proporcionan
    const modelSettings = settings || {
      model: 'claude-3-haiku-20240307',
      temperature: 0.7,
      maxTokens: 1000
    };

    // Construir el mensaje del sistema basado en el comportamiento configurado
    let systemPrompt = `Eres un chatbot llamado ${chatbotName || 'Asistente'}. `;
    
    if (behavior) {
      // Agregar instrucciones sobre el tono
      if (behavior.tone) {
        systemPrompt += `Debes responder con un tono ${behavior.tone}. `;
      }
      
      // Agregar instrucciones sobre el estilo
      if (behavior.style) {
        systemPrompt += `Tu estilo de respuesta debe ser ${behavior.style}. `;
      }
      
      // Agregar instrucciones sobre el idioma
      if (behavior.language) {
        const languageMap: Record<string, string> = {
          'english': 'inglés',
          'spanish': 'español',
          'french': 'francés',
          'german': 'alemán',
          'chinese': 'chino',
          'japanese': 'japonés'
        };
        
        const languageDisplay = languageMap[behavior.language] || behavior.language;
        systemPrompt += `Debes comunicarte en ${languageDisplay}. `;
      }
      
      // Agregar instrucciones sobre el uso de emojis
      if (behavior.useEmojis) {
        systemPrompt += `Usa emojis en tus respuestas cuando sea apropiado. `;
      } else {
        systemPrompt += `No uses emojis en tus respuestas. `;
      }
      
      // Agregar instrucciones sobre hacer preguntas
      if (behavior.askQuestions) {
        systemPrompt += `Haz preguntas al usuario para entender mejor sus necesidades. `;
      }
      
      // Agregar instrucciones sobre sugerir soluciones
      if (behavior.suggestSolutions) {
        systemPrompt += `Siempre sugiere soluciones prácticas a los problemas del usuario. `;
      }
      
      // Agregar instrucciones personalizadas adicionales
      if (behavior.instructions) {
        systemPrompt += `Instrucciones adicionales: ${behavior.instructions}`;
      }
    }

    // Formatear mensajes para la API de Anthropic (sin incluir el mensaje del sistema como parte de los mensajes)
    const formattedMessages = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: modelSettings.model,
        messages: formattedMessages,
        system: systemPrompt, // El mensaje del sistema se envía como un campo separado
        max_tokens: modelSettings.maxTokens,
        temperature: modelSettings.temperature,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Anthropic API error:', errorData);
      throw new Error(`API error: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    console.log('Anthropic API response:', data);

    return new Response(JSON.stringify({ 
      message: data.content[0].text,
      model: data.model,
      usage: data.usage
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in claude-chat function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
