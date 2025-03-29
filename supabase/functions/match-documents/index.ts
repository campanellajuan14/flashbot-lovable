
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.14.0";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') as string;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') as string;
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

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
    const { query, chatbotId, threshold, limit, model, adaptiveThreshold } = await req.json();
    
    if (!query || !chatbotId) {
      return new Response(
        JSON.stringify({ error: "Query and chatbotId are required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Get retrieval settings if they exist
    let retrievalSettings = null;
    try {
      const { data: settings, error } = await supabase
        .from('retrieval_settings')
        .select('*')
        .eq('chatbot_id', chatbotId)
        .single();
      
      if (!error && settings) {
        retrievalSettings = settings;
        console.log("Retrieved settings:", retrievalSettings);
      } else {
        // If no configuration exists, create a default one
        console.log("No retrieval settings found, creating default");
        const { data: chatbot } = await supabase
          .from('chatbots')
          .select('name')
          .eq('id', chatbotId)
          .single();
          
        const chatbotName = chatbot?.name || 'Unnamed Chatbot';
        
        const { error: insertError } = await supabase
          .from('retrieval_settings')
          .insert({
            chatbot_id: chatbotId,
            similarity_threshold: 0.65, // More permissive by default
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
    
    // Get embeddings for the query
    const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        input: query,
        model: model || retrievalSettings?.embedding_model || "text-embedding-ada-002"
      })
    });
    
    if (!embeddingResponse.ok) {
      const errorData = await embeddingResponse.text();
      throw new Error(`OpenAI API error: ${embeddingResponse.status} ${errorData}`);
    }
    
    const embeddingData = await embeddingResponse.json();
    const embedding = embeddingData.data[0].embedding;
    
    // Implement adaptive threshold - starting with configured or provided value
    let thresholds = [];
    let finalDocuments = [];
    
    // If adaptiveThreshold is enabled, use different thresholds
    if (adaptiveThreshold) {
      thresholds = [
        threshold || retrievalSettings?.similarity_threshold || 0.7, // Strict (first option)
        0.65, // Moderate
        0.6,  // Permissive
        0.5   // Very permissive (last resort)
      ];
    } else {
      // Only use one threshold
      thresholds = [threshold || retrievalSettings?.similarity_threshold || 0.7];
    }
    
    const maxResults = limit || retrievalSettings?.max_results || 5;
    
    // Try with each threshold until finding documents or exhausting options
    for (const currentThreshold of thresholds) {
      console.log(`Trying with threshold: ${currentThreshold}`);
      
      const { data: documents, error } = await supabase.rpc(
        'match_documents',
        {
          query_embedding: embedding,
          p_chatbot_id: chatbotId,
          match_threshold: currentThreshold,
          match_count: maxResults
        }
      );
      
      if (error) {
        console.error("Error in match_documents RPC:", error);
        continue;
      }
      
      if (documents && documents.length > 0) {
        console.log(`Found ${documents.length} documents with threshold ${currentThreshold}`);
        finalDocuments = documents;
        break; // Found documents, exit the loop
      }
    }
    
    // Log metrics if there are documents (optional)
    if (finalDocuments.length > 0) {
      try {
        const responseTime = Date.now(); // As an approximation
        await supabase.from('retrieval_metrics').insert({
          chatbot_id: chatbotId,
          precision: finalDocuments[0]?.similarity || 0,
          response_time: responseTime,
          tokens_used: embeddingData.usage?.total_tokens || 0
        });
      } catch (metricsError) {
        console.error("Error logging metrics:", metricsError);
      }
    }
    
    return new Response(
      JSON.stringify({ 
        documents: finalDocuments,
        documentsFound: finalDocuments.length,
        usedAdaptiveThreshold: adaptiveThreshold
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in match-documents:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : String(error) 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
