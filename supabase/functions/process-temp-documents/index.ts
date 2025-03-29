
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") as string;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") as string;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to generate embeddings using OpenAI API
async function getEmbeddings(text: string, model = "text-embedding-ada-002") {
  if (!OPENAI_API_KEY) {
    console.error("OpenAI API key not found.");
    throw new Error("OpenAI API key not found.");
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
      console.error("Error en la API de OpenAI:", errorData);
      throw new Error(`Error en la API de OpenAI: ${response.status}`);
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
    
    if (!realChatbotId || !tempChatbotId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Se requiere real chatbot ID y temp chatbot ID" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Processing temporary documents from ${tempChatbotId} to ${realChatbotId}`);
    
    try {
      // Get all documents from Supabase KV storage by prefix
      const { data: kvData, error: kvError } = await fetch(
        `${SUPABASE_URL}/functions/v1/kv-get-documents-by-chatbot`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ tempChatbotId })
        }
      ).then(res => res.json());
      
      if (kvError) {
        throw new Error(`Error retrieving documents from KV: ${kvError}`);
      }
      
      const tempDocuments = kvData?.documents || [];
      console.log(`Retrieved ${tempDocuments.length} documents from storage`);
      
      // Process each document
      let processedCount = 0;
      for (const doc of tempDocuments) {
        try {
          // Generate embedding
          const embeddingModel = doc.metadata?.embeddingModel || "text-embedding-ada-002";
          const embedding = await getEmbeddings(doc.content, embeddingModel);
          
          // Save to documents table with real chatbot ID
          const response = await fetch(`${SUPABASE_URL}/rest/v1/documents`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
              chatbot_id: realChatbotId,
              name: doc.name,
              content: doc.content,
              embedding,
              metadata: doc.metadata,
              user_id: userId || doc.userId
            })
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error al guardar documento ${doc.name}:`, errorText);
            throw new Error(`Error al guardar documento en Supabase: ${response.status}`);
          }
          
          processedCount++;
        } catch (docError) {
          console.error(`Error processing document ${doc.name}:`, docError);
        }
      }
      
      // Clean up KV storage after successful processing
      if (processedCount > 0) {
        await fetch(
          `${SUPABASE_URL}/functions/v1/kv-clear-documents-by-chatbot`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({ tempChatbotId })
          }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          processedCount,
          totalCount: tempDocuments.length
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
      
    } catch (error) {
      console.error("Error processing temporary documents:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
