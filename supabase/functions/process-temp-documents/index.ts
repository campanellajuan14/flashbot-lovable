
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
    const { realChatbotId, tempChatbotId, userId } = await req.json();
    
    if (!realChatbotId || !tempChatbotId || !userId) {
      return new Response(
        JSON.stringify({ error: "Se requieren realChatbotId, tempChatbotId y userId" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Get temporary documents from KV storage
    const { data: documents, error: getError } = await supabase
      .rpc('get_temp_documents', { temp_id: tempChatbotId });
    
    if (getError) {
      throw new Error(`Error retrieving temporary documents: ${getError.message}`);
    }
    
    if (!documents || documents.length === 0) {
      console.log(`No temporary documents found for chatbot ${tempChatbotId}`);
      return new Response(
        JSON.stringify({ success: true, processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Found ${documents.length} temporary documents to process`);
    
    // Process each document
    const processResults = [];
    
    for (const doc of documents) {
      console.log(`Processing document: ${doc.name}`);
      
      // Update the document with the real chatbot ID
      const documentData = {
        chatbot_id: realChatbotId,
        name: doc.name,
        content: doc.content,
        user_id: userId,
        metadata: doc.metadata || {}
      };
      
      const { data: insertResult, error: insertError } = await supabase
        .from('documents')
        .insert(documentData)
        .select('id');
      
      if (insertError) {
        console.error(`Error inserting document: ${insertError.message}`);
        processResults.push({
          name: doc.name,
          success: false,
          error: insertError.message
        });
        continue;
      }
      
      processResults.push({
        name: doc.name,
        success: true,
        id: insertResult[0]?.id
      });
    }
    
    // Clear temporary documents
    const { error: clearError } = await supabase
      .rpc('clear_temp_documents', { temp_id: tempChatbotId });
    
    if (clearError) {
      console.error(`Error clearing temporary documents: ${clearError.message}`);
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        processed: processResults.filter(r => r.success).length,
        failed: processResults.filter(r => !r.success).length,
        results: processResults
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error processing temporary documents:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : String(error) 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
