
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.14.0";
import { corsHeaders, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, defaultSettings, fallbackSettings } from "./config.ts";
import { isAuthorized, generateUnauthorizedResponse } from "./utils/auth.ts";
import { getRetrievalSettings, searchRelevantDocuments, createDocumentContext } from "./utils/retrieval.ts";
import { buildSystemPrompt } from "./utils/prompts.ts";
import { handleConversation, logMessageMetrics } from "./utils/conversation.ts";
import { callAnthropicAPI } from "./services/anthropicService.ts";
import { callOpenAIAPI } from "./services/openaiService.ts";
import { RequestData, ResponseData, Message } from "./types.ts";

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
    const requestData: RequestData = await req.json();
    const { 
      messages, 
      behavior, 
      chatbotName, 
      settings, 
      chatbotId, 
      widget_id, 
      source, 
      conversationId, 
      user_info,
      user_identifier,
      request_id
    } = requestData;

    // Log request details for debugging
    console.log('Request received:');
    console.log('- Source:', source);
    console.log('- Widget ID:', widget_id);
    console.log('- Chatbot ID:', chatbotId);
    console.log('- Conversation ID:', conversationId);
    console.log('- Request ID:', request_id || 'no-id');
    
    // Authorization check
    if (!isAuthorized(authHeader, apiKey, clientInfo, origin, referer, source || '')) {
      console.error('Unauthorized request: No authentication and not a widget/webhook request');
      return generateUnauthorizedResponse();
    }

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Invalid request: messages array is required');
    }

    console.log('Received request with messages:', messages);
    console.log('Behavior settings:', behavior);
    console.log('Model settings:', settings);
    console.log('Chatbot ID:', chatbotId);

    // Initialize Supabase client
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
    const effectiveSettings = settings || chatbotInfo?.settings || defaultSettings;
    const effectiveChatbotName = chatbotName || chatbotInfo?.name || 'Assistant';
    
    // Get retrieval settings and relevant documents
    const retrievalSettings = await getRetrievalSettings(chatbotId || '');
    
    // Get the last user message for search
    const lastUserMessage = [...messages].reverse().find(msg => msg.role === 'user')?.content || '';
    
    // Search for relevant documents
    const relevantDocuments = await searchRelevantDocuments(supabase, lastUserMessage, chatbotId || '', retrievalSettings);
    const documentContext = createDocumentContext(relevantDocuments);

    // Build system prompt based on configured behavior
    const systemPrompt = buildSystemPrompt(effectiveChatbotName, effectiveBehavior, documentContext, source);

    // Format messages for Anthropic API
    const formattedMessages = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));

    let data: any;
    let usedFallback = false;
    
    try {
      // Try calling the Anthropic API first
      console.log(`🧠 [${request_id || 'no-id'}] Llamando a Claude API con modelo ${effectiveSettings.model || defaultSettings.model}`);
      data = await callAnthropicAPI(
        formattedMessages, 
        systemPrompt, 
        effectiveSettings.model || defaultSettings.model,
        effectiveSettings.maxTokens || defaultSettings.maxTokens,
        effectiveSettings.temperature || defaultSettings.temperature
      );
      console.log(`✅ [${request_id || 'no-id'}] Respuesta de Claude API recibida`);
    } catch (anthropicError) {
      console.error(`❌ [${request_id || 'no-id'}] Error de Claude API:`, anthropicError);
      
      // Determine if it's an overload error
      const errorMsg = anthropicError.message || '';
      const isOverloadError = 
        errorMsg.includes('overloaded') || 
        errorMsg.includes('Overloaded') || 
        errorMsg.includes('429') ||
        errorMsg.includes('rate limit');
      
      // If it's an overload error, try with OpenAI as fallback
      if (isOverloadError) {
        console.log(`⚠️ [${request_id || 'no-id'}] Claude sobrecargado, usando OpenAI como fallback`);
        
        try {
          data = await callOpenAIAPI(
            formattedMessages,
            systemPrompt,
            fallbackSettings.model,
            fallbackSettings.maxTokens,
            fallbackSettings.temperature
          );
          usedFallback = true;
          console.log(`✅ [${request_id || 'no-id'}] Respuesta de OpenAI recibida como fallback`);
        } catch (openaiError) {
          console.error(`❌ [${request_id || 'no-id'}] Error en fallback de OpenAI:`, openaiError);
          throw new Error(`Claude sobrecargado y fallback a OpenAI falló: ${openaiError.message}`);
        }
      } else {
        // For other errors, propagate the original error
        throw anthropicError;
      }
    }
    
    console.log('API response:', data);

    // Handle conversation registration and persistence
    const { conversationId: generatedConversationId } = await handleConversation(
      conversationId,
      chatbotId,
      source, 
      widget_id,
      user_identifier,
      messages,
      data.content[0].text
    );

    // Build response with document references if there are relevant documents
    const responseData: ResponseData = {
      message: data.content[0].text,
      model: data.model,
      usage: data.usage,
      conversation_id: generatedConversationId,
      used_fallback: usedFallback
    };
    
    // Add document references
    if (relevantDocuments.length > 0) {
      responseData.references = relevantDocuments.map(doc => ({
        id: doc.id,
        name: doc.name,
        similarity: doc.similarity
      }));
    }
    
    // Log message metrics for analysis
    await logMessageMetrics(chatbotId, lastUserMessage, relevantDocuments.length, data.usage?.output_tokens);

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in claude-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : String(error),
      errorType: error instanceof Error && error.message.includes('overloaded') ? 'overloaded' : 'general'  
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
