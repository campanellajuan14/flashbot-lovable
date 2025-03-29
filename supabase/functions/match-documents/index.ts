
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
    const { query, chatbotId, threshold, limit, model } = await req.json();
    
    if (!query || !chatbotId) {
      return new Response(
        JSON.stringify({ error: "Se requiere query y chatbotId" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Inicializar cliente de Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Obtener embeddings para la consulta
    const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        input: query,
        model: model || "text-embedding-ada-002"
      })
    });
    
    if (!embeddingResponse.ok) {
      const errorData = await embeddingResponse.text();
      throw new Error(`OpenAI API error: ${embeddingResponse.status} ${errorData}`);
    }
    
    const embeddingData = await embeddingResponse.json();
    const embedding = embeddingData.data[0].embedding;
    
    // Buscar documentos similares
    const { data: documents, error } = await supabase.rpc(
      'match_documents',
      {
        query_embedding: embedding,
        p_chatbot_id: chatbotId,
        match_threshold: threshold || 0.7,
        match_count: limit || 5
      }
    );
    
    if (error) {
      throw error;
    }
    
    return new Response(
      JSON.stringify({ documents }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error en match-documents:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : String(error) 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
