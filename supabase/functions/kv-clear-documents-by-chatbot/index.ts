
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
    // Check for required credentials
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }
    
    // Parse request body to get tempChatbotId
    let tempChatbotId: string;
    try {
      const body = await req.json();
      tempChatbotId = body.tempChatbotId;
      
      if (!tempChatbotId) {
        throw new Error("Missing required parameter: tempChatbotId");
      }
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid request body, tempChatbotId is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    console.log(`Clearing documents for chatbot ID: ${tempChatbotId}`);
    
    // Limpiar documentos del storage KV
    const { error: clearError } = await supabase
      .rpc('clear_temp_documents', { temp_id: tempChatbotId });
    
    if (clearError) {
      console.error(`Error clearing KV storage: ${clearError.message}`);
      throw new Error(`Error clearing KV storage: ${clearError.message}`);
    }
    
    console.log(`Successfully cleared documents for chatbot ${tempChatbotId}`);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Documents cleared successfully for chatbot ID: ${tempChatbotId}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error clearing documents from KV:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : String(error),
        status: "error"
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
