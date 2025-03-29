
// This file contains the edge function for processing documents and generating embeddings.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") as string;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") as string;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Función para generar embeddings usando la API de OpenAI
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

// Función mejorada para dividir el texto en chunks de manera más inteligente
function improvedSplitTextIntoChunks(text: string, chunkSize = 1000, overlap = 200) {
  // Normalizar saltos de línea
  const normalizedText = text.replace(/\r\n/g, '\n');
  
  // Intentar dividir por párrafos primero
  const paragraphs = normalizedText.split(/\n\s*\n/);
  
  const chunks = [];
  let currentChunk = '';
  let currentSize = 0;
  
  // Función para estimar tokens (aproximación rudimentaria)
  function estimateTokens(text: string): number {
    return Math.ceil(text.length / 4); // Aproximación simple: ~4 caracteres por token
  }
  
  for (const paragraph of paragraphs) {
    const paragraphSize = estimateTokens(paragraph);
    
    // Si el párrafo es muy grande, dividirlo en oraciones
    if (paragraphSize > chunkSize) {
      // Dividir párrafos grandes en oraciones
      const sentences = paragraph.split(/(?<=[.!?])\s+/);
      
      for (const sentence of sentences) {
        const sentenceSize = estimateTokens(sentence);
        
        // Si la oración es demasiado grande (raro), dividirla por la fuerza
        if (sentenceSize > chunkSize) {
          let remainingSentence = sentence;
          while (remainingSentence.length > 0) {
            const chunkText = remainingSentence.slice(0, chunkSize * 4); // Multiplicamos por 4 para volver a caracteres
            chunks.push(chunkText);
            remainingSentence = remainingSentence.slice(Math.max(0, (chunkSize - overlap) * 4));
          }
        } else if (currentSize + sentenceSize <= chunkSize) {
          // La oración cabe en el chunk actual
          currentChunk += (currentChunk ? ' ' : '') + sentence;
          currentSize += sentenceSize;
        } else {
          // La oración no cabe, guardar chunk actual y empezar uno nuevo
          chunks.push(currentChunk);
          currentChunk = sentence;
          currentSize = sentenceSize;
        }
      }
    } else if (currentSize + paragraphSize <= chunkSize) {
      // El párrafo cabe en el chunk actual
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      currentSize += paragraphSize;
    } else {
      // El párrafo no cabe, guardar chunk actual y empezar uno nuevo
      chunks.push(currentChunk);
      currentChunk = paragraph;
      currentSize = paragraphSize;
    }
  }
  
  // No olvidar el último chunk
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  // Si no hay chunks (texto muy corto), devolver el texto original
  if (chunks.length === 0 && text.trim()) {
    chunks.push(text);
  }
  
  return chunks;
}

// Función simple para el caso de error
function splitTextIntoChunks(text: string, chunkSize = 1000, overlap = 200) {
  const chunks = [];
  let i = 0;

  while (i < text.length) {
    // Si es el último chunk, ajustar para no exceder el texto
    const end = Math.min(i + chunkSize, text.length);
    chunks.push(text.slice(i, end));
    i += chunkSize - overlap;
    // Asegurarse de que no nos pasamos
    if (i >= text.length) break;
    // Ajustar el inicio para no ir antes del inicio del texto
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
    
    // Validación de entrada
    if (!chatbotId || !text || !fileName) {
      return new Response(
        JSON.stringify({ success: false, error: "Faltan parámetros requeridos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Processing document for chatbot ${chatbotId}, userId: ${userId}`);
    console.log(`Filename: ${fileName}, fileType: ${fileType}`);
    
    // Configurar tamaño de chunks y solapamiento desde la configuración o usar valores por defecto
    const chunkSize = retrievalSettings?.chunk_size || 1000;
    const chunkOverlap = retrievalSettings?.chunk_overlap || 200;
    console.log(`Usando configuración: chunkSize=${chunkSize}, chunkOverlap=${chunkOverlap}`);
    
    // Dividir el documento en chunks más pequeños - usar la versión mejorada
    let chunks = [];
    try {
      chunks = improvedSplitTextIntoChunks(text, chunkSize, chunkOverlap);
      console.log(`Documento dividido en ${chunks.length} chunks usando chunking semántico`);
    } catch (chunkError) {
      console.error("Error en chunking semántico, usando método simple:", chunkError);
      chunks = splitTextIntoChunks(text, chunkSize, chunkOverlap);
      console.log(`Documento dividido en ${chunks.length} chunks usando chunking simple`);
    }
    
    // Verificar de nuevo si tenemos la clave de OpenAI antes de intentar generar embeddings
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
    
    // Generar embeddings para cada chunk y guardar en Supabase
    const processedChunks = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      try {
        // Generar embedding usando OpenAI
        const embeddingModel = retrievalSettings?.embedding_model || "text-embedding-ada-002";
        const embedding = await getEmbeddings(chunk, embeddingModel);
        
        // Crear un título descriptivo para el chunk
        let chunkTitle = fileName;
        if (chunks.length > 1) {
          // Si es múltiple, añadir indicación de parte
          chunkTitle = `${fileName} (parte ${i+1}/${chunks.length})`;
        }
        
        // Preparar metadatos del documento
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
        
        // Guardar en la tabla documents
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
      } catch (chunkError) {
        console.error(`Error procesando chunk ${i}:`, chunkError);
        // Continuar con el siguiente chunk en lugar de abortar todo el proceso
      }
    }
    
    // Retornar respuesta exitosa con detalles del procesamiento
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
