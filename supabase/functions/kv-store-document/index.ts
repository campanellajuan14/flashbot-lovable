
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.14.0";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') as string;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;

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
    const { tempChatbotId, document } = await req.json();
    
    if (!tempChatbotId || !document) {
      return new Response(
        JSON.stringify({ error: "Se requieren tempChatbotId y document" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Generate a unique ID for this document
    const docId = crypto.randomUUID();
    
    console.log(`Storing document ${document.name} with ID ${docId} for chatbot ${tempChatbotId}`);
    
    // Connect to Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Store the document in Supabase Database instead of KV
    // Use a temporary table approach instead of KV store
    try {
      const { data, error } = await supabase
        .from('temp_documents')
        .insert({
          temp_chatbot_id: tempChatbotId,
          document_id: docId,
          name: document.name,
          content: document.content,
          metadata: document.metadata
        });
      
      if (error) {
        throw new Error(`Error storing document: ${error.message}`);
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          documentId: docId,
          message: `Document ${document.name} stored successfully`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (dbError) {
      console.error("Error storing document:", dbError);
      throw new Error(`Error storing document: ${dbError.message}`);
    }
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
