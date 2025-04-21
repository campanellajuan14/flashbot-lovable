import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.14.0";
import { connect } from "https://deno.land/x/redis/mod.ts";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') as string;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') as string;
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const REDIS_URL = Deno.env.get('REDIS_URL');

// Track active connections for connection pooling
let activeConnections = 0;
const MAX_CONNECTIONS = 8;
const CONNECTION_TIMEOUT = 2000; // 2 seconds

// Connection pool
const connectionPool: any[] = [];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get a client from the connection pool or create a new one
async function getClient() {
  // If we have available connections in the pool, use one
  if (connectionPool.length > 0) {
    return connectionPool.pop();
  }
  
  // If we're at max connections, wait for one to become available
  if (activeConnections >= MAX_CONNECTIONS) {
    console.log(`Waiting for connection: active=${activeConnections}, pool=${connectionPool.length}`);
    await new Promise(resolve => setTimeout(resolve, CONNECTION_TIMEOUT));
    return getClient(); // Recursively try again
  }
  
  // Create a new connection
  activeConnections++;
  console.log(`Creating new connection: active=${activeConnections}`);
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Return a client to the pool when done
function releaseClient(client: any) {
  if (connectionPool.length < MAX_CONNECTIONS) {
    connectionPool.push(client);
  } else {
    activeConnections--;
  }
  console.log(`Released connection: active=${activeConnections}, pool=${connectionPool.length}`);
}

// Initialize Redis connection
let redisClient: any = null;
async function getRedisClient() {
  if (!REDIS_URL) {
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log(`Request received at ${new Date().toISOString()}`);
  
  try {
    const { query, chatbotId, threshold, limit, model, adaptiveThreshold } = await req.json();
    
    if (!query || !chatbotId) {
      return new Response(
        JSON.stringify({ error: "Query and chatbotId are required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const redis = await getRedisClient();
    const cacheKey = `match:${chatbotId}:${query.substring(0, 50)}`;
    
    // Try to get results from cache first
    if (redis) {
      try {
        const cachedResult = await redis.get(cacheKey);
        if (cachedResult) {
          console.log(`Cache hit for query "${query.substring(0, 20)}..."`);
          return new Response(
            cachedResult,
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (cacheError) {
        console.error('Cache error:', cacheError);
      }
    }
    
    // Initialize Supabase client from pool
    const supabase = await getClient();
    
    try {
      // Get retrieval settings if they exist
      let retrievalSettings = null;
      
      try {
        const { data, error } = await supabase
          .from('retrieval_settings')
          .select('*')
          .eq('chatbot_id', chatbotId)
          .single();
        
        if (!error && data) {
          retrievalSettings = data;
          console.log('Retrieved settings:', retrievalSettings);
        } else {
          console.log('No custom retrieval settings found, using defaults');
        }
      } catch (settingsError) {
        console.error('Error fetching retrieval settings:', settingsError);
      }
      
      // Get embeddings for the query
      const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          input: query,
          model: model || retrievalSettings?.embedding_model || "text-embedding-ada-002"
        })
      });
      
      if (!embeddingResponse.ok) {
        const errorData = await embeddingResponse.text();
        throw new Error(`OpenAI API error: ${embeddingResponse.status} ${errorData}`);
      }
      
      const embeddingData = await embeddingResponse.json();
      const embedding = embeddingData.data[0].embedding;
      
      // Implement adaptive threshold - starting with configured or provided value
      let thresholds = [];
      let finalDocuments = [];
      
      // If adaptiveThreshold is enabled, use different thresholds
      if (adaptiveThreshold) {
        thresholds = [
          threshold || retrievalSettings?.similarity_threshold || 0.7, // Strict (first option)
          0.65, // Moderate
          0.6,  // Permissive
          0.5   // Very permissive (last resort)
        ];
      } else {
        // Only use one threshold
        thresholds = [threshold || retrievalSettings?.similarity_threshold || 0.7];
      }
      
      const maxResults = limit || retrievalSettings?.max_results || 5;
      
      // Try each threshold in sequence until we get results or run out of thresholds
      for (const currentThreshold of thresholds) {
        console.log(`Trying threshold: ${currentThreshold}`);
        
        const { data: documents, error } = await supabase.rpc('match_documents', {
          query_embedding: embedding,
          match_threshold: currentThreshold,
          match_count: maxResults,
          chatbot_id: chatbotId
        });
        
        if (error) {
          console.error('Error matching documents:', error);
          continue;
        }
        
        if (documents && documents.length > 0) {
          finalDocuments = documents;
          console.log(`Found ${documents.length} documents with threshold ${currentThreshold}`);
          break;
        }
      }
      
      const result = {
        documents: finalDocuments,
        meta: {
          count: finalDocuments.length,
          processingTime: Date.now() - startTime,
          query
        }
      };
      
      const resultJson = JSON.stringify(result);
      
      // Cache the results if we have Redis
      if (redis) {
        try {
          // Cache for 5 minutes
          await redis.set(cacheKey, resultJson, {ex: 300});
          console.log('Results cached');
        } catch (redisError) {
          console.error('Redis caching error:', redisError);
        }
      }
      
      console.log(`Request completed in ${Date.now() - startTime}ms`);
      
      return new Response(
        resultJson,
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } finally {
      // Always return the client to the pool
      releaseClient(supabase);
    }
  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'An unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
