// Document retrieval functionality
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.14.0";
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from "../config.ts";
import { connect } from "https://deno.land/x/redis/mod.ts";

const REDIS_URL = Deno.env.get('REDIS_URL');
let redisClient: any = null;

// Initialize Redis connection
async function getRedisClient() {
  if (!REDIS_URL) {
    console.log("Redis URL not configured, skipping cache");
    return null;
  }
  
  if (!redisClient) {
    try {
      redisClient = await connect(REDIS_URL);
      console.log("Redis connection established");
    } catch (error) {
      console.error("Redis connection failed:", error);
      return null;
    }
  }
  return redisClient;
}

/**
 * Gets retrieval settings for a chatbot
 */
export async function getRetrievalSettings(chatbotId: string) {
  // Try to get from cache first
  const redis = await getRedisClient();
  const cacheKey = `retrieval_settings:${chatbotId}`;
  
  if (redis) {
    try {
      const cachedSettings = await redis.get(cacheKey);
      if (cachedSettings) {
        console.log('Retrieved settings from cache');
        return JSON.parse(cachedSettings);
      }
    } catch (cacheError) {
      console.error('Cache retrieval error:', cacheError);
    }
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  try {
    const { data: settings, error } = await supabase
      .from('retrieval_settings')
      .select('*')
      .eq('chatbot_id', chatbotId)
      .single();
    
    if (!error) {
      console.log('Retrieved settings from database:', settings);
      
      // Cache the result with 10 minute expiry
      if (redis && settings) {
        try {
          await redis.set(cacheKey, JSON.stringify(settings), {ex: 600});
          console.log('Cached retrieval settings');
        } catch (cacheError) {
          console.error('Error caching settings:', cacheError);
        }
      }
      
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
          
          // Cache the new settings
          if (redis && newSettings) {
            try {
              await redis.set(cacheKey, JSON.stringify(newSettings), {ex: 600});
            } catch (cacheError) {
              console.error('Error caching new settings:', cacheError);
            }
          }
          
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

/**
 * Function to get documents with caching
 */
export async function getDocumentsWithCache(chatbotId: string, query: string, embedding: number[]) {
  const redis = await getRedisClient();
  const cacheKey = `document_results:${chatbotId}:${query.substring(0, 50)}`;
  
  // Try to get from cache first
  if (redis) {
    try {
      const cachedResults = await redis.get(cacheKey);
      if (cachedResults) {
        console.log('Retrieved document matches from cache');
        return JSON.parse(cachedResults);
      }
    } catch (cacheError) {
      console.error('Document cache retrieval error:', cacheError);
    }
  }
  
  // If not in cache, perform the database query
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const settings = await getRetrievalSettings(chatbotId);
  
  const { data: documents, error } = await supabase.rpc('match_documents', {
    query_embedding: embedding,
    match_threshold: settings?.similarity_threshold || 0.65,
    match_count: settings?.max_results || 4,
    chatbot_id: chatbotId
  });
  
  if (error) {
    console.error('Error retrieving documents:', error);
    return [];
  }
  
  // Cache the results with 5 minute expiry
  if (redis && documents) {
    try {
      await redis.set(cacheKey, JSON.stringify(documents), {ex: 300});
      console.log('Cached document query results');
    } catch (cacheError) {
      console.error('Error caching document results:', cacheError);
    }
  }
  
  return documents;
}
