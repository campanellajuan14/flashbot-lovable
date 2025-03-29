
// This file contains the edge function for processing documents and generating embeddings.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") as string;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") as string;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to generate embeddings using OpenAI API
async function getEmbeddings(text: string, model = "text-embedding-ada-002") {
  if (!OPENAI_API_KEY) {
    console.error("OpenAI API key not found. Please set the OPENAI_API_KEY environment variable.");
    throw new Error("OpenAI API key not found. Please set the OPENAI_API_KEY environment variable.");
  }

  try {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        input: text,
        model: model
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Error en la API de OpenAI:", errorData);
      throw new Error(`Error en la API de OpenAI: ${response.status}`);
    }

    const json = await response.json();
    return json.data[0].embedding;
  } catch (error) {
    console.error("Error al generar embeddings:", error);
    throw error;
  }
}

// Improved function to split text into chunks semantically
function improvedSplitTextIntoChunks(text: string, chunkSize = 1000, overlap = 200) {
  // Normalize line breaks
  const normalizedText = text.replace(/\r\n/g, '\n');
  
  // Try to split by paragraphs first
  const paragraphs = normalizedText.split(/\n\s*\n/);
  
  const chunks = [];
  let currentChunk = '';
  let currentSize = 0;
  
  // Function to estimate tokens (rudimentary approximation)
  function estimateTokens(text: string): number {
    return Math.ceil(text.length / 4); // Simple approximation: ~4 characters per token
  }
  
  for (const paragraph of paragraphs) {
    const paragraphSize = estimateTokens(paragraph);
    
    // If paragraph is very large, split it into sentences
    if (paragraphSize > chunkSize) {
      // Split large paragraphs into sentences
      const sentences = paragraph.split(/(?<=[.!?])\s+/);
      
      for (const sentence of sentences) {
        const sentenceSize = estimateTokens(sentence);
        
        // If sentence is too large (rare), force split it
        if (sentenceSize > chunkSize) {
          let remainingSentence = sentence;
          while (remainingSentence.length > 0) {
            const chunkText = remainingSentence.slice(0, chunkSize * 4); // Multiply by 4 to convert back to characters
            chunks.push(chunkText);
            remainingSentence = remainingSentence.slice(Math.max(0, (chunkSize - overlap) * 4));
          }
        } else if (currentSize + sentenceSize <= chunkSize) {
          // Sentence fits in current chunk
          currentChunk += (currentChunk ? ' ' : '') + sentence;
          currentSize += sentenceSize;
        } else {
          // Sentence doesn't fit, save current chunk and start a new one
          chunks.push(currentChunk);
          currentChunk = sentence;
          currentSize = sentenceSize;
        }
      }
    } else if (currentSize + paragraphSize <= chunkSize) {
      // Paragraph fits in current chunk
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      currentSize += paragraphSize;
    } else {
      // Paragraph doesn't fit, save current chunk and start a new one
      chunks.push(currentChunk);
      currentChunk = paragraph;
      currentSize = paragraphSize;
    }
  }
  
  // Don't forget the last chunk
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  // If no chunks (very short text), return the original text
  if (chunks.length === 0 && text.trim()) {
    chunks.push(text);
  }
  
  return chunks;
}

// Simple fallback function for chunking in case of error
function splitTextIntoChunks(text: string, chunkSize = 1000, overlap = 200) {
  const chunks = [];
  let i = 0;

  while (i < text.length) {
    // If this is the last chunk, adjust to not exceed the text
    const end = Math.min(i + chunkSize, text.length);
    chunks.push(text.slice(i, end));
    i += chunkSize - overlap;
    // Make sure we don't go past the end
    if (i >= text.length) break;
    // Adjust the start to not go before the beginning of the text
    i = Math.max(0, i);
  }

  return chunks;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { chatbotId, text, fileName, fileType, userId, retrievalSettings } = await req.json();
    
    // Input validation
    if (!chatbotId || !text || !fileName) {
      return new Response(
        JSON.stringify({ success: false, error: "Faltan parámetros requeridos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Processing document for chatbot ${chatbotId}, userId: ${userId}`);
    console.log(`Filename: ${fileName}, fileType: ${fileType}`);
    
    // Configure chunk size and overlap from settings or use defaults
    const chunkSize = retrievalSettings?.chunk_size || 1000;
    const chunkOverlap = retrievalSettings?.chunk_overlap || 200;
    console.log(`Usando configuración: chunkSize=${chunkSize}, chunkOverlap=${chunkOverlap}`);
    
    // Split document into smaller chunks - use the improved version
    let chunks = [];
    try {
      chunks = improvedSplitTextIntoChunks(text, chunkSize, chunkOverlap);
      console.log(`Documento dividido en ${chunks.length} chunks usando chunking semántico`);
    } catch (chunkError) {
      console.error("Error en chunking semántico, usando método simple:", chunkError);
      chunks = splitTextIntoChunks(text, chunkSize, chunkOverlap);
      console.log(`Documento dividido en ${chunks.length} chunks usando chunking simple`);
    }
    
    // Verify again that we have the OpenAI key before trying to generate embeddings
    if (!OPENAI_API_KEY) {
      console.error("ERROR: OPENAI_API_KEY no está configurada");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "OpenAI API key not found. Please set the OPENAI_API_KEY environment variable." 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Generate embeddings for each chunk and save to Supabase
    const processedChunks = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      try {
        // Generate embedding using OpenAI
        const embeddingModel = retrievalSettings?.embedding_model || "text-embedding-ada-002";
        const embedding = await getEmbeddings(chunk, embeddingModel);
        
        // Create a descriptive title for the chunk
        let chunkTitle = fileName;
        if (chunks.length > 1) {
          // If multiple chunks, add part indication
          chunkTitle = `${fileName} (parte ${i+1}/${chunks.length})`;
        }
        
        // Prepare document metadata
        const metadata = {
          fileName,
          fileType,
          source: 'upload',
          processingDate: new Date().toISOString(),
          chunkIndex: i,
          totalChunks: chunks.length,
          isChunk: chunks.length > 1,
          chunkingMethod: 'semantic',
          approximateTokens: Math.ceil(chunk.length / 4),
          embeddingModel
        };
        
        // For temporary IDs (chatbot creation), store in localStorage for later processing
        if (chatbotId.startsWith('temp-')) {
          // Store for later processing after chatbot creation
          const tempDoc = {
            name: chunkTitle,
            content: chunk,
            metadata,
            timestamp: new Date().toISOString(),
            userId
          };
          
          // Get existing temp docs or initialize empty array
          const storageKey = `temp_docs_${chatbotId}`;
          let tempDocs = [];
          try {
            const existing = localStorage.getItem(storageKey);
            tempDocs = existing ? JSON.parse(existing) : [];
          } catch (e) {
            console.error("Error parsing stored temp docs:", e);
            tempDocs = [];
          }
          
          // Add new temp doc and store back
          tempDocs.push(tempDoc);
          localStorage.setItem(storageKey, JSON.stringify(tempDocs));
          console.log(`Stored document chunk in temporary storage for later processing: ${chunkTitle}`);
          
          processedChunks.push(i);
        } else {
          // Save directly to the documents table for existing chatbots
          const response = await fetch(`${SUPABASE_URL}/rest/v1/documents`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
              chatbot_id: chatbotId,
              name: chunkTitle,
              content: chunk,
              embedding,
              metadata,
              user_id: userId
            })
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error al guardar chunk ${i}:`, errorText);
            throw new Error(`Error al guardar documento en Supabase: ${response.status}`);
          }
          
          processedChunks.push(i);
        }
      } catch (chunkError) {
        console.error(`Error procesando chunk ${i}:`, chunkError);
        // Continue with the next chunk instead of aborting the whole process
      }
    }
    
    // Return successful response with processing details
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Documento "${fileName}" procesado exitosamente en ${chunks.length} chunks.`,
        chunksProcessed: processedChunks.length,
        totalChunks: chunks.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error en process-documents:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
