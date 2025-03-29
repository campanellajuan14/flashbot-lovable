
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
    
    console.log(`Processing temporary documents from ${tempChatbotId} to ${realChatbotId}`);
    
    // Get temporary documents from KV storage
    const { data: keys, error: listError } = await supabase.rpc(
      'kv_list_keys',
      { 
        prefix: `temp_docs:${tempChatbotId}:` 
      }
    );
    
    if (listError) {
      throw new Error(`Error listing KV keys: ${listError.message}`);
    }
    
    if (!keys || keys.length === 0) {
      console.log(`No temporary documents found for chatbot ${tempChatbotId}`);
      return new Response(
        JSON.stringify({ success: true, processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Found ${keys.length} temporary document keys to process`);
    
    // Process each document
    const processResults = [];
    
    for (const key of keys) {
      // Get document from KV
      const { data: doc, error: getError } = await supabase.rpc(
        'kv_get',
        { key }
      );
      
      if (getError || !doc) {
        console.error(`Error retrieving document with key ${key}: ${getError?.message || 'No data'}`);
        processResults.push({
          key,
          success: false,
          error: getError?.message || 'No data found'
        });
        continue;
      }
      
      console.log(`Processing document: ${doc.name}`);
      
      // Insert document into database with real chatbot ID
      const { data: insertResult, error: insertError } = await supabase
        .from('documents')
        .insert({
          chatbot_id: realChatbotId,
          name: doc.name,
          content: doc.content,
          user_id: userId,
          metadata: doc.metadata || {}
        })
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
      
      // Delete the processed document from KV
      const { error: deleteError } = await supabase.rpc(
        'kv_del',
        { key }
      );
      
      if (deleteError) {
        console.warn(`Error deleting key ${key}: ${deleteError.message}`);
      }
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
