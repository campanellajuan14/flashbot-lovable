
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
    const { tempChatbotId } = await req.json();
    
    if (!tempChatbotId) {
      return new Response(
        JSON.stringify({ error: "Se requiere tempChatbotId" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Connect to Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    console.log(`Getting documents for chatbot ${tempChatbotId}`);
    
    try {
      // Get all documents for this chatbot
      const { data: documents, error: getError } = await supabase
        .from('temp_documents')
        .select('*')
        .eq('temp_chatbot_id', tempChatbotId);
      
      if (getError) {
        throw new Error(`Error getting documents: ${getError.message}`);
      }
      
      if (!documents || documents.length === 0) {
        return new Response(
          JSON.stringify({ 
            success: true,
            documents: []
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log(`Found ${documents.length} documents for chatbot ${tempChatbotId}`);
      
      // Map the documents to the expected format
      const formattedDocuments = documents.map(doc => ({
        id: doc.document_id,
        name: doc.name,
        content: doc.content,
        metadata: doc.metadata
      }));
      
      return new Response(
        JSON.stringify({ 
          success: true,
          documents: formattedDocuments,
          count: formattedDocuments.length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (dbError) {
      console.error("Error retrieving documents:", dbError);
      throw new Error(`Error retrieving documents: ${dbError.message}`);
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
