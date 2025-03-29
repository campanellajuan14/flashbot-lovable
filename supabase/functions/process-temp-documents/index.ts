
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.14.0";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') as string;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to generate embeddings using OpenAI API
async function getEmbeddings(text: string, model = "text-embedding-ada-002") {
  if (!OPENAI_API_KEY) {
    throw new Error("OpenAI API key not found");
  }

  try {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        input: text,
        model: model
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Error en la API de OpenAI: ${response.status} - ${errorData}`);
    }

    const json = await response.json();
    return json.data[0].embedding;
  } catch (error) {
    console.error("Error al generar embeddings:", error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { realChatbotId, tempChatbotId, userId } = await req.json();
    
    if (!realChatbotId || !tempChatbotId || !userId) {
      return new Response(
        JSON.stringify({ error: "Se requiere realChatbotId, tempChatbotId y userId" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Processing temp documents from ${tempChatbotId} to ${realChatbotId}`);
    
    // Connect to Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Get all temp documents for this chatbot
    const { data: tempDocuments, error: getError } = await supabase
      .from('temp_documents')
      .select('*')
      .eq('temp_chatbot_id', tempChatbotId);
    
    if (getError) {
      throw new Error(`Error getting temp documents: ${getError.message}`);
    }
    
    if (!tempDocuments || tempDocuments.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true,
          processed: 0,
          message: "No temporary documents found"
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Found ${tempDocuments.length} temp documents to process`);
    
    // Process each document
    let processedCount = 0;
    
    for (const doc of tempDocuments) {
      try {
        // Generate embedding for this document
        const embedding = await getEmbeddings(doc.content);
        
        // Save to the documents table
        const { error: insertError } = await supabase
          .from('documents')
          .insert({
            chatbot_id: realChatbotId,
            name: doc.name,
            content: doc.content,
            embedding,
            metadata: doc.metadata,
            user_id: userId
          });
        
        if (insertError) {
          console.error(`Error saving document ${doc.name}:`, insertError);
          continue;
        }
        
        processedCount++;
        
        // Delete the temp document
        await supabase
          .from('temp_documents')
          .delete()
          .eq('id', doc.id);
        
      } catch (docError) {
        console.error(`Error processing document ${doc.name}:`, docError);
        // Continue with next document
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true,
        processed: processedCount,
        total: tempDocuments.length,
        message: `${processedCount} of ${tempDocuments.length} documents processed successfully`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : String(error) 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
