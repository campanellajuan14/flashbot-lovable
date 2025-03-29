
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.14.0";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') as string;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessTempDocumentsRequest {
  realChatbotId: string;
  tempChatbotId: string;
  userId: string;
}

interface TempDocument {
  id: string;
  document_id: string;
  name: string;
  content: string;
  metadata: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { realChatbotId, tempChatbotId, userId } = await req.json() as ProcessTempDocumentsRequest;
    
    if (!realChatbotId || !tempChatbotId || !userId) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Missing required parameters: realChatbotId, tempChatbotId, userId"
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Processing temporary documents for chatbot ${tempChatbotId} -> ${realChatbotId}`);
    
    // Connect to Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Get retrieval settings for embedding configuration
    let retrievalSettings = {};
    try {
      const { data: settings, error: settingsError } = await supabase
        .rpc('get_retrieval_settings', { 
          p_chatbot_id: realChatbotId 
        });
      
      if (settingsError) {
        console.error("Error fetching retrieval settings:", settingsError);
        
        // Create default settings if none exist
        try {
          const { data: defaultSettings, error: createError } = await supabase
            .from('retrieval_settings')
            .insert({
              chatbot_id: realChatbotId,
              chunk_size: 1000,
              chunk_overlap: 200,
              embedding_model: "text-embedding-ada-002"
            })
            .select()
            .single();
          
          if (createError) {
            console.error("Error creating default settings:", createError);
          } else {
            retrievalSettings = defaultSettings;
          }
        } catch (createSettingsError) {
          console.error("Error creating default settings:", createSettingsError);
        }
      } else {
        retrievalSettings = settings;
      }
    } catch (error) {
      console.error("Error retrieving settings:", error);
    }
    
    // Get all temporary documents for this chatbot
    const { data: tempDocuments, error: fetchError } = await supabase
      .from('temp_documents')
      .select('*')
      .eq('temp_chatbot_id', tempChatbotId);
    
    if (fetchError) {
      throw new Error(`Error fetching temporary documents: ${fetchError.message}`);
    }
    
    if (!tempDocuments || tempDocuments.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          processed: 0,
          message: "No temporary documents found to process"
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Found ${tempDocuments.length} temporary documents to process`);
    
    // Process each document and save to the documents table
    const processPromises = tempDocuments.map(async (doc: TempDocument) => {
      try {
        // Create the document in the documents table
        const { error: insertError } = await supabase
          .from('documents')
          .insert({
            id: doc.document_id, // Use the same UUID that was generated for the temp document
            chatbot_id: realChatbotId,
            name: doc.name,
            content: doc.content,
            metadata: doc.metadata || {},
            user_id: userId
          });
        
        if (insertError) {
          console.error(`Error inserting document ${doc.name}:`, insertError);
          return false;
        }
        
        // Process document for embeddings using the process-documents function
        try {
          const { data: processResult, error: processError } = await supabase.functions.invoke(
            'process-documents',
            {
              body: {
                chatbotId: realChatbotId,
                text: doc.content,
                fileName: doc.name,
                fileType: doc.metadata?.fileType || 'text/plain',
                userId: userId,
                retrievalSettings
              }
            }
          );
          
          if (processError) {
            console.error(`Error processing document ${doc.name} for embeddings:`, processError);
            return false;
          }
          
          // After successful processing, delete the temporary document
          const { error: deleteError } = await supabase
            .from('temp_documents')
            .delete()
            .eq('id', doc.id);
          
          if (deleteError) {
            console.error(`Error deleting temporary document ${doc.name}:`, deleteError);
          }
          
          return true;
        } catch (processError) {
          console.error(`Error invoking process-documents for ${doc.name}:`, processError);
          return false;
        }
      } catch (docError) {
        console.error(`Error processing document ${doc.name}:`, docError);
        return false;
      }
    });
    
    // Wait for all documents to be processed
    const results = await Promise.allSettled(processPromises);
    
    // Count successful operations
    const successful = results.filter(
      result => result.status === 'fulfilled' && result.value === true
    ).length;
    
    return new Response(
      JSON.stringify({
        success: true,
        processed: successful,
        total: tempDocuments.length,
        message: `Successfully processed ${successful} of ${tempDocuments.length} documents.`
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
