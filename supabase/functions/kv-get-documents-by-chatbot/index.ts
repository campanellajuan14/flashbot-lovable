
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
      // Get all keys for this chatbot using the list_keys RPC function
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
        return new Response(
          JSON.stringify({ 
            success: true,
            documents: []
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log(`Found ${keys.length} document keys for chatbot ${tempChatbotId}`);
      
      // Get all documents using the keys
      const documents = [];
      
      for (const key of keys) {
        const { data: document, error: getError } = await supabase.rpc(
          'kv_get',
          { key }
        );
        
        if (getError) {
          console.error(`Error getting document with key ${key}: ${getError.message}`);
          continue;
        }
        
        if (document) {
          documents.push(document);
        }
      }
      
      return new Response(
        JSON.stringify({ 
          success: true,
          documents,
          count: documents.length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (kvError) {
      console.error("Error retrieving documents from KV:", kvError);
      throw new Error(`Error retrieving documents from KV: ${kvError.message}`);
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
