
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.14.0";

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') as string;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') as string;

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
    const { messages, behavior, chatbotName, settings, chatbotId } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Invalid request: messages array is required');
    }

    console.log('Received request with messages:', messages);
    console.log('Behavior settings:', behavior);
    console.log('Model settings:', settings);
    console.log('Chatbot ID:', chatbotId);

    // Inicializar cliente de Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Obtener la configuración de recuperación
    let retrievalSettings = null;
    if (chatbotId) {
      const { data: settings, error } = await supabase
        .from('retrieval_settings')
        .select('*')
        .eq('chatbot_id', chatbotId)
        .single();
      
      if (!error) {
        retrievalSettings = settings;
        console.log('Retrieved settings:', retrievalSettings);
      } else {
        console.error('Error fetching retrieval settings:', error);
      }
    }

    // Obtener el último mensaje del usuario para la búsqueda
    const lastUserMessage = [...messages].reverse().find(msg => msg.role === 'user')?.content;
    
    // Documentos relevantes para agregar al contexto
    let relevantDocuments = [];
    let documentContext = "";
    
    // Si hay un ID de chatbot y un mensaje de usuario, buscar documentos relevantes
    if (chatbotId && lastUserMessage) {
      try {
        // Obtener embeddings para el mensaje del usuario
        const openaiResponse = await fetch("https://api.openai.com/v1/embeddings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}`
          },
          body: JSON.stringify({
            input: lastUserMessage,
            model: retrievalSettings?.embedding_model || "text-embedding-ada-002"
          })
        });

        if (!openaiResponse.ok) {
          throw new Error(`OpenAI API error: ${openaiResponse.status}`);
        }

        const openaiData = await openaiResponse.json();
        const queryEmbedding = openaiData.data[0].embedding;

        // Buscar documentos con similitud usando el vector de embeddings
        const { data: documents, error } = await supabase.rpc(
          'match_documents',
          {
            query_embedding: queryEmbedding,
            p_chatbot_id: chatbotId,
            match_threshold: retrievalSettings?.similarity_threshold || 0.7,
            match_count: retrievalSettings?.max_results || 3
          }
        );

        if (error) {
          throw error;
        }

        if (documents && documents.length > 0) {
          console.log(`Found ${documents.length} relevant documents`);
          relevantDocuments = documents;
          
          // Crear contexto con los documentos recuperados
          documentContext = "Here are some relevant documents that might help you answer the question:\n\n";
          documents.forEach((doc, i) => {
            documentContext += `DOCUMENT ${i+1}: ${doc.name}\n${doc.content}\n\n`;
          });
        } else {
          console.log('No relevant documents found');
        }
      } catch (error) {
        console.error('Error in document retrieval:', error);
        // Continuar sin documentos en caso de error
      }
    }

    // Use provided settings or fallback to defaults
    const modelSettings = settings || {
      model: 'claude-3-haiku-20240307',
      temperature: 0.7,
      maxTokens: 1000
    };

    // Build system prompt based on configured behavior
    let systemPrompt = `Eres un chatbot llamado ${chatbotName || 'Asistente'}. `;
    
    if (behavior) {
      // Add tone instructions
      if (behavior.tone) {
        systemPrompt += `Debes responder con un tono ${behavior.tone}. `;
      }
      
      // Add style instructions
      if (behavior.style) {
        systemPrompt += `Tu estilo de respuesta debe ser ${behavior.style}. `;
      }
      
      // Add language instructions
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
      
      // Add emoji usage instructions
      if (behavior.useEmojis) {
        systemPrompt += `Usa emojis en tus respuestas cuando sea apropiado. `;
      } else {
        systemPrompt += `No uses emojis en tus respuestas. `;
      }
      
      // Add asking questions instructions
      if (behavior.askQuestions) {
        systemPrompt += `Haz preguntas al usuario para entender mejor sus necesidades. `;
      }
      
      // Add suggesting solutions instructions
      if (behavior.suggestSolutions) {
        systemPrompt += `Siempre sugiere soluciones prácticas a los problemas del usuario. `;
      }
      
      // Add custom instructions
      if (behavior.instructions) {
        systemPrompt += `Instrucciones adicionales: ${behavior.instructions}`;
      }
    }

    // Agregar instrucciones sobre cómo usar el contexto de documentos si hay documentos relevantes
    if (documentContext) {
      systemPrompt += `\n\nUsa la siguiente información de documentos como contexto para responder las preguntas del usuario. Cítala cuando sea relevante pero no digas explícitamente que estás usando documentos a menos que te lo pidan directamente. Usa esta información como tu conocimiento:\n\n${documentContext}`;
    }

    // Format messages for Anthropic API (without including system message in the messages array)
    const formattedMessages = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));

    console.log('System prompt:', systemPrompt);

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
        system: systemPrompt, // System message sent as a separate field
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

    // Construir respuesta con referencias a documentos si hay documentos relevantes
    const responseData = {
      message: data.content[0].text,
      model: data.model,
      usage: data.usage
    };
    
    // Agregar referencias a documentos solo si es solicitado en la configuración
    if (settings?.includeReferences && relevantDocuments.length > 0) {
      responseData.references = relevantDocuments.map(doc => ({
        id: doc.id,
        name: doc.name,
        similarity: doc.similarity
      }));
    }

    return new Response(JSON.stringify(responseData), {
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
