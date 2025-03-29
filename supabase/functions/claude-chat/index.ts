
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

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Get retrieval settings
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
        // Create default configuration
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

    // Get the last user message for search
    const lastUserMessage = [...messages].reverse().find(msg => msg.role === 'user')?.content;
    
    // Relevant documents to add to context
    let relevantDocuments = [];
    let documentContext = "";
    
    // If there is a chatbot ID and a user message, search for relevant documents
    if (chatbotId && lastUserMessage) {
      try {
        // Invoke the edge match-documents function with adaptive threshold
        // for higher probability of finding relevant documents
        const matchResponse = await supabase.functions.invoke('match-documents', {
          body: {
            query: lastUserMessage,
            chatbotId,
            threshold: retrievalSettings?.similarity_threshold,
            limit: retrievalSettings?.max_results,
            model: retrievalSettings?.embedding_model,
            adaptiveThreshold: true // Enable adaptive threshold
          }
        });

        if (matchResponse.error) {
          throw new Error(`Match documents error: ${matchResponse.error}`);
        }

        if (matchResponse.data && matchResponse.data.documents && matchResponse.data.documents.length > 0) {
          console.log(`Found ${matchResponse.data.documents.length} relevant documents`);
          relevantDocuments = matchResponse.data.documents;
          
          // Create context with retrieved documents in a more structured way
          documentContext = "Here are some relevant documents that might help you answer the question:\n\n";
          relevantDocuments.forEach((doc, i) => {
            documentContext += `DOCUMENT ${i+1}: ${doc.name}\n${doc.content}\n\n`;
          });
        } else {
          console.log('No relevant documents found');
        }
      } catch (error) {
        console.error('Error in document retrieval:', error);
        // Continue without documents in case of error
      }
    }

    // Use provided settings or fallback to defaults
    const modelSettings = settings || {
      model: 'claude-3-haiku-20240307',
      temperature: 0.7,
      maxTokens: 1000
    };

    // Build improved system prompt based on configured behavior
    let systemPrompt = `You are a chatbot named ${chatbotName || 'Assistant'}. `;
    
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
        model: modelSettings.model,
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

    // Build response with document references if there are relevant documents
    const responseData = {
      message: data.content[0].text,
      model: data.model,
      usage: data.usage
    };
    
    // Add document references
    if (relevantDocuments.length > 0) {
      responseData.references = relevantDocuments.map(doc => ({
        id: doc.id,
        name: doc.name,
        similarity: doc.similarity
      }));
    }

    // Log this interaction for analysis (optional)
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
