
// Document retrieval functionality
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.14.0";
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from "../config.ts";

/**
 * Gets retrieval settings for a chatbot
 */
export async function getRetrievalSettings(chatbotId: string) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  try {
    const { data: settings, error } = await supabase
      .from('retrieval_settings')
      .select('*')
      .eq('chatbot_id', chatbotId)
      .single();
    
    if (!error) {
      console.log('Retrieved settings:', settings);
      return settings;
    } else {
      console.error('Error fetching retrieval settings:', error);
      
      // Create default configuration
      const { error: insertError } = await supabase
        .from('retrieval_settings')
        .insert({
          chatbot_id: chatbotId,
          similarity_threshold: 0.65,
          max_results: 4,
          chunk_size: 1000,
          chunk_overlap: 200,
          use_hierarchical_embeddings: false,
          embedding_model: "text-embedding-ada-002",
          use_cache: true
        });
        
      if (insertError) {
        console.error("Error creating default settings:", insertError);
        return null;
      } else {
        const { data: newSettings } = await supabase
          .from('retrieval_settings')
          .select('*')
          .eq('chatbot_id', chatbotId)
          .single();
          
        if (newSettings) {
          console.log("Using newly created settings:", newSettings);
          return newSettings;
        }
      }
    }
  } catch (settingsError) {
    console.error("Error handling retrieval settings:", settingsError);
  }
  
  return null;
}

/**
 * Searches for relevant documents based on a user query
 */
export async function searchRelevantDocuments(supabase: any, query: string, chatbotId: string, retrievalSettings: any) {
  if (!query || !chatbotId) {
    return [];
  }
  
  try {
    console.log("Searching for relevant documents with query:", query);
    
    // Invoke the edge match-documents function with adaptive threshold
    const matchResponse = await supabase.functions.invoke('match-documents', {
      body: {
        query: query,
        chatbotId,
        threshold: retrievalSettings?.similarity_threshold,
        limit: retrievalSettings?.max_results,
        model: retrievalSettings?.embedding_model,
        adaptiveThreshold: true // Enable adaptive threshold
      }
    });

    if (matchResponse.error) {
      console.error(`Match documents error:`, matchResponse.error);
      return [];
    }

    console.log("Match documents response:", matchResponse.data);
    
    if (matchResponse.data && matchResponse.data.documents && matchResponse.data.documents.length > 0) {
      console.log(`Found ${matchResponse.data.documents.length} relevant documents`);
      return matchResponse.data.documents;
    }
  } catch (error) {
    console.error('Error in document retrieval:', error);
  }
  
  console.log('No relevant documents found');
  return [];
}

/**
 * Creates context string from retrieved documents
 */
export function createDocumentContext(documents: any[]) {
  if (documents.length === 0) {
    return "";
  }
  
  let documentContext = "Here are some relevant documents that might help you answer the question:\n\n";
  documents.forEach((doc, i) => {
    documentContext += `DOCUMENT ${i+1}: ${doc.name}\n${doc.content}\n\n`;
  });
  
  return documentContext;
}
