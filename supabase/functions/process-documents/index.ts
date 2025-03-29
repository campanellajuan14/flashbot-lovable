
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

// Función para dividir el texto en chunks más pequeños
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
    
    // Dividir el documento en chunks más pequeños
    const chunks = splitTextIntoChunks(text, chunkSize, chunkOverlap);
    
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
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      // Generar embedding usando OpenAI
      const embedding = await getEmbeddings(chunk);
      
      // Preparar metadatos del documento
      const metadata = {
        fileName,
        fileType,
        source: 'upload',
        chunkIndex: i,
        totalChunks: chunks.length,
        isChunk: chunks.length > 1,
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
          name: chunks.length > 1 ? `${fileName} (parte ${i+1}/${chunks.length})` : fileName,
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
    }
    
    // Retornar respuesta exitosa
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Documento "${fileName}" procesado exitosamente en ${chunks.length} chunks.` 
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
