
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
    try {
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
        // Crear configuración por defecto
        const { error: insertError } = await supabase
          .from('retrieval_settings')
          .insert({
            chatbot_id: chatbotId,
            similarity_threshold: 0.65,
            max_results: 4,
            chunk_size: 1000,
            chunk_overlap: 200,
            use_hierarchical_embeddings: false,
            embedding_model: "text-embedding-ada-002",
            use_cache: true
          });
          
        if (insertError) {
          console.error("Error creating default settings:", insertError);
        } else {
          const { data: newSettings } = await supabase
            .from('retrieval_settings')
            .select('*')
            .eq('chatbot_id', chatbotId)
            .single();
            
          if (newSettings) {
            retrievalSettings = newSettings;
            console.log("Using newly created settings:", retrievalSettings);
          }
        }
      }
    } catch (settingsError) {
      console.error("Error handling retrieval settings:", settingsError);
    }

    // Obtener el último mensaje del usuario para la búsqueda
    const lastUserMessage = [...messages].reverse().find(msg => msg.role === 'user')?.content;
    
    // Documentos relevantes para agregar al contexto
    let relevantDocuments = [];
    let documentContext = "";
    
    // Si hay un ID de chatbot y un mensaje de usuario, buscar documentos relevantes
    if (chatbotId && lastUserMessage) {
      try {
        // Invocar la función edge match-documents con umbral adaptativo 
        // para mayor probabilidad de encontrar documentos relevantes
        const matchResponse = await supabase.functions.invoke('match-documents', {
          body: {
            query: lastUserMessage,
            chatbotId,
            threshold: retrievalSettings?.similarity_threshold,
            limit: retrievalSettings?.max_results,
            model: retrievalSettings?.embedding_model,
            adaptiveThreshold: true // Habilitar umbral adaptativo
          }
        });

        if (matchResponse.error) {
          throw new Error(`Match documents error: ${matchResponse.error}`);
        }

        if (matchResponse.data && matchResponse.data.documents && matchResponse.data.documents.length > 0) {
          console.log(`Found ${matchResponse.data.documents.length} relevant documents`);
          relevantDocuments = matchResponse.data.documents;
          
          // Crear contexto con los documentos recuperados de manera más estructurada
          documentContext = "Here are some relevant documents that might help you answer the question:\n\n";
          relevantDocuments.forEach((doc, i) => {
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

    // Map OpenAI models to Claude models if needed
    let claudeModel = 'claude-3-haiku-20240307'; // Default Claude model
    
    if (modelSettings.model) {
      // Map OpenAI models to Claude models
      if (modelSettings.model === 'gpt-4o-mini' || modelSettings.model === 'gpt-3.5-turbo') {
        claudeModel = 'claude-3-haiku-20240307'; // Use Haiku for less powerful models
      } else if (modelSettings.model === 'gpt-4o' || modelSettings.model === 'gpt-4-turbo') {
        claudeModel = 'claude-3-sonnet-20240229'; // Use Sonnet for more powerful models
      } else if (modelSettings.model.startsWith('claude-')) {
        // If it's already a Claude model, use it as is
        claudeModel = modelSettings.model;
      }
    }
    
    console.log(`Using Claude model: ${claudeModel} (mapped from: ${modelSettings.model})`);

    // Build improved system prompt based on configured behavior
    let systemPrompt = `Eres un chatbot llamado ${chatbotName || 'Asistente'}. `;
    
    if (behavior) {
      // Add tone instructions
      if (behavior.tone) {
        systemPrompt += `\nDebes responder con un tono ${behavior.tone}. `;
      }
      
      // Add style instructions
      if (behavior.style) {
        systemPrompt += `\nTu estilo de respuesta debe ser ${behavior.style}. `;
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
        systemPrompt += `\nDebes comunicarte en ${languageDisplay}. `;
      }
      
      // Add emoji usage instructions
      if (behavior.useEmojis) {
        systemPrompt += `\nUsa emojis en tus respuestas cuando sea apropiado. `;
      } else {
        systemPrompt += `\nNo uses emojis en tus respuestas. `;
      }
      
      // Add asking questions instructions
      if (behavior.askQuestions) {
        systemPrompt += `\nHaz preguntas al usuario para entender mejor sus necesidades. `;
      }
      
      // Add suggesting solutions instructions
      if (behavior.suggestSolutions) {
        systemPrompt += `\nSiempre sugiere soluciones prácticas a los problemas del usuario. `;
      }
      
      // Add custom instructions
      if (behavior.instructions) {
        systemPrompt += `\nInstrucciones adicionales: ${behavior.instructions}`;
      }
    }

    // Instrucciones mejoradas para el uso del contexto de documentos
    if (documentContext) {
      systemPrompt += `\n\nUsa la siguiente información de documentos como contexto para responder las preguntas del usuario:

${documentContext}

Instrucciones importantes sobre el uso de estos documentos:
1. Basa tu respuesta principalmente en estos documentos cuando sean relevantes a la pregunta.
2. Si la información en los documentos contradice tu conocimiento general, prioriza la información de los documentos.
3. Si la pregunta no puede responderse completamente con los documentos, complementa con tu conocimiento general, pero indica claramente cuando estás haciendo esto.
4. No menciones explícitamente que estás usando "documentos" a menos que el usuario te pregunte específicamente por tus fuentes.
5. Si citas información de los documentos, hazlo de manera natural y fluida en tu respuesta.
6. Si necesitas hacer referencia a un documento específico, puedes referirte al contenido sin mencionar que es un documento.`;
    }

    console.log('System prompt:', systemPrompt);

    // Format messages for Anthropic API
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
        model: claudeModel,
        messages: formattedMessages,
        system: systemPrompt,
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
    
    // Agregar referencias a documentos
    if (relevantDocuments.length > 0) {
      responseData.references = relevantDocuments.map(doc => ({
        id: doc.id,
        name: doc.name,
        similarity: doc.similarity
      }));
    }

    // Registrar esta interacción para análisis (opcional)
    try {
      await supabase.from('message_metrics').insert({
        chatbot_id: chatbotId,
        query: lastUserMessage,
        has_documents: relevantDocuments.length > 0,
        document_count: relevantDocuments.length,
        message_tokens: data.usage?.output_tokens || 0,
        created_at: new Date().toISOString()
      }).select();
    } catch (metricsError) {
      console.error("Error logging message metrics:", metricsError);
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
