import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.14.0";

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') as string;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') as string;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check for authorization header
    const authHeader = req.headers.get('Authorization');
    const apiKey = req.headers.get('apikey');
    const clientInfo = req.headers.get('x-client-info');
    const origin = req.headers.get('Origin') || '';
    const referer = req.headers.get('Referer') || '';

    console.log('Request headers debug:');
    console.log('- Auth header present:', !!authHeader);
    console.log('- API key present:', !!apiKey);
    console.log('- Client Info:', clientInfo);
    console.log('- Origin:', origin);
    console.log('- Referer:', referer);

    // Parse request data first so we have access to source
    const requestData = await req.json();
    const { messages, behavior, chatbotName, settings, chatbotId, widget_id, source, conversationId, user_info } = requestData;

    // Log request details for debugging
    console.log('Request received:');
    console.log('- Source:', source);
    console.log('- Widget ID:', widget_id);
    console.log('- Chatbot ID:', chatbotId);
    console.log('- Conversation ID:', conversationId);
    
    // Now that we have source, do authorization checks
    // Special widget authorization check
    // Allow requests from the widget preview page or with widget source
    const isWidgetRequest = 
      (clientInfo && (clientInfo.includes('widget') || clientInfo.includes('embed'))) || 
      referer.includes('widget') || 
      origin.includes('widget') ||
      apiKey === SUPABASE_ANON_KEY;
      
    // Allow requests from WhatsApp webhook function
    const isInternalRequest = 
      source === 'whatsapp-webhook' ||
      source === 'whatsapp_webhook' ||
      clientInfo?.includes('whatsapp') ||
      referer?.includes('whatsapp');
      
    console.log('- Is widget request:', isWidgetRequest);
    console.log('- Is internal (webhook) request:', isInternalRequest);

    if (!authHeader && !isWidgetRequest && !isInternalRequest) {
      console.error('Unauthorized request: No authentication and not a widget/webhook request');
      return new Response(JSON.stringify({
        error: 'Unauthorized',
        details: 'No valid authentication provided'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Invalid request: messages array is required');
    }

    console.log('Received request with messages:', messages);
    console.log('Behavior settings:', behavior);
    console.log('Model settings:', settings);
    console.log('Chatbot ID:', chatbotId);

    // Initialize Supabase client with SERVICE_ROLE_KEY to bypass RLS
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Get chatbot info if not provided (for widget requests)
    let chatbotInfo = null;
    if (chatbotId && (!behavior || !settings)) {
      try {
        const { data, error } = await supabase
          .from('chatbots')
          .select('*, share_settings')
          .eq('id', chatbotId)
          .single();
          
        if (error) {
          console.error('Error fetching chatbot info:', error);
        } else {
          chatbotInfo = data;
          console.log('Retrieved chatbot info:', chatbotInfo);
        }
      } catch (chatbotError) {
        console.error('Error retrieving chatbot:', chatbotError);
      }
    }
    
    // Use chatbotInfo to supplement missing data for widget requests
    const effectiveBehavior = behavior || chatbotInfo?.behavior || {};
    const effectiveSettings = settings || chatbotInfo?.settings || {
      model: 'claude-3-haiku-20240307',
      temperature: 0.7,
      maxTokens: 1000
    };
    const effectiveChatbotName = chatbotName || chatbotInfo?.name || 'Assistant';
    
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
        console.log("Searching for relevant documents with query:", lastUserMessage);
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
          console.error(`Match documents error:`, matchResponse.error);
          throw new Error(`Match documents error: ${matchResponse.error}`);
        }

        console.log("Match documents response:", matchResponse.data);
        
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

    // Build improved system prompt based on configured behavior
    let systemPrompt = `You are a chatbot named ${effectiveChatbotName}. `;
    
    if (effectiveBehavior) {
      // Add tone instructions
      if (effectiveBehavior.tone) {
        systemPrompt += `\nYou should respond in a ${effectiveBehavior.tone} tone. `;
      }
      
      // Add style instructions
      if (effectiveBehavior.style) {
        systemPrompt += `\nYour response style should be ${effectiveBehavior.style}. `;
      }
      
      // Add language instructions
      if (effectiveBehavior.language) {
        const languageMap: Record<string, string> = {
          'english': 'English',
          'spanish': 'Spanish',
          'french': 'French',
          'german': 'German',
          'chinese': 'Chinese',
          'japanese': 'Japanese'
        };
        
        const languageDisplay = languageMap[effectiveBehavior.language] || effectiveBehavior.language;
        systemPrompt += `\nYou must communicate in ${languageDisplay}. `;
      }
      
      // Add emoji usage instructions
      if (effectiveBehavior.useEmojis) {
        systemPrompt += `\nUse emojis in your responses when appropriate. `;
      } else {
        systemPrompt += `\nDon't use emojis in your responses. `;
      }
      
      // Add asking questions instructions
      if (effectiveBehavior.askQuestions) {
        systemPrompt += `\nAsk questions to better understand the user's needs. `;
      }
      
      // Add suggesting solutions instructions
      if (effectiveBehavior.suggestSolutions) {
        systemPrompt += `\nAlways suggest practical solutions to the user's problems. `;
      }
      
      // Add custom instructions
      if (effectiveBehavior.instructions) {
        systemPrompt += `\nAdditional instructions: ${effectiveBehavior.instructions}`;
      }
      
      // Add greeting if available
      if (effectiveBehavior.greeting) {
        systemPrompt += `\nYour initial greeting is: "${effectiveBehavior.greeting}"`;
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
        model: effectiveSettings.model,
        messages: formattedMessages,
        system: systemPrompt,
        max_tokens: effectiveSettings.maxTokens,
        temperature: effectiveSettings.temperature,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Anthropic API error:', errorData);
      throw new Error(`API error: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    console.log('Anthropic API response:', data);

    // Generate or use provided conversation ID
    const generatedConversationId = conversationId || crypto.randomUUID();

    // Build response with document references if there are relevant documents
    const responseData = {
      message: data.content[0].text,
      model: data.model,
      usage: data.usage,
      conversation_id: generatedConversationId
    };
    
    // Add document references
    if (relevantDocuments.length > 0) {
      responseData.references = relevantDocuments.map(doc => ({
        id: doc.id,
        name: doc.name,
        similarity: doc.similarity
      }));
    }

    // If we're generating a new conversation ID (not using an existing one),
    // register it in the database to ensure it's properly tracked
    if (!conversationId && chatbotId) {
      // ADD LOG HERE (1)
      console.log(`[AutoReg] Attempting auto-registration for chatbot ${chatbotId}. New Conversation ID: ${generatedConversationId}`);
      try {
        console.log(`[AutoReg] Checking if conversation ${generatedConversationId} already exists.`); // ADD LOG HERE (2)
        // Check if conversation already exists (shouldn't, but being safe)
        const { data: existingConv, error: checkError } = await supabase // Capture potential checkError
          .from('conversations')
          .select('id')
          .eq('id', generatedConversationId)
          .maybeSingle(); // Use maybeSingle to avoid error if not found

        // ADD LOG HERE (3) - Log check result and any error
        if (checkError) {
           console.error(`[AutoReg] Error checking for existing conversation ${generatedConversationId}:`, checkError);
        } else {
           console.log(`[AutoReg] Existing conversation check for ${generatedConversationId}: Found = ${!!existingConv}`);
        }
          
        // Only proceed if no error during check AND conversation doesn't exist
        if (!checkError && !existingConv) { 
          console.log(`[AutoReg] Attempting to insert new conversation record ${generatedConversationId}...`); // ADD LOG HERE (4)
          // Insert the new conversation record
          const { error: insertError } = await supabase
            .from('conversations')
            .insert({
              id: generatedConversationId,
              chatbot_id: chatbotId,
              // MODIFIED: Use requestData directly for user_identifier
              user_identifier: requestData.user_identifier || 'anonymous', 
              metadata: { 
                source: source || 'api',
                widget_id: widget_id || null,
                auto_registered: true
              }
            });
            
          if (insertError) {
            // ADD LOG HERE (5) - Log conversation insert error
            console.error(`[AutoReg] FAILED to insert conversation ${generatedConversationId}:`, insertError);
          } else {
            // ADD LOG HERE (6) - Log conversation insert success
            console.log(`[AutoReg] SUCCESS inserting conversation ${generatedConversationId}.`);
            
            // Also register initial messages
            if (messages && Array.isArray(messages) && messages.length > 0) {
              const lastMessage = messages[messages.length - 1];
              const messagesToInsert = [
                {
                  conversation_id: generatedConversationId,
                  content: lastMessage.content,
                  role: lastMessage.role,
                  metadata: {}
                },
                {
                  conversation_id: generatedConversationId,
                  content: data.content[0].text,
                  role: 'assistant',
                  metadata: {}
                }
              ];

              console.log(`[AutoReg] Attempting to insert ${messagesToInsert.length} initial messages for conversation ${generatedConversationId}...`); // ADD LOG HERE (7)
              
              const { error: messagesError } = await supabase
                .from('messages')
                .insert(messagesToInsert);
                
              if (messagesError) {
                 // ADD LOG HERE (8) - Log messages insert error
                console.error(`[AutoReg] FAILED to insert initial messages for ${generatedConversationId}:`, messagesError);
              } else {
                 // ADD LOG HERE (9) - Log messages insert success
                console.log(`[AutoReg] SUCCESS inserting initial messages for ${generatedConversationId}.`);
              }
            }
          }
        } else if (!checkError && existingConv) {
            // ADD LOG HERE (10) - Log if conversation already existed
            console.log(`[AutoReg] Skipped inserting conversation ${generatedConversationId} because it already exists.`);
        }
      } catch (regError) {
        // ADD LOG HERE (11) - Log any error caught by the outer try...catch
        console.error(`[AutoReg] CRITICAL ERROR during auto-registration block for conversation ${generatedConversationId}:`, regError);
        // Continue despite error - don't block the response
      }
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
