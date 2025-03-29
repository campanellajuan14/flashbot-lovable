
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";

// OpenAI API para generar embeddings
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const OPENAI_EMBEDDING_MODEL = "text-embedding-ada-002";
const OPENAI_API_URL = "https://api.openai.com/v1/embeddings";

// Configuración Supabase para acceso directo a la base de datos
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Función para obtener embeddings de OpenAI
async function getEmbeddings(text: string): Promise<number[]> {
  try {
    // Check if OpenAI API key is available
    if (!OPENAI_API_KEY) {
      console.error("OpenAI API key not found in environment variables");
      throw new Error("OpenAI API key not found. Please set the OPENAI_API_KEY environment variable.");
    }

    console.log("Generating embeddings for text of length:", text.length);
    
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: OPENAI_EMBEDDING_MODEL,
        input: text.replace(/\n/g, " ").slice(0, 8000), // Limit to 8000 chars for OpenAI
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error en la API de OpenAI:", errorText);
      throw new Error(`Error en la API de OpenAI: ${response.status}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error("Error al generar embeddings:", error);
    throw error;
  }
}

// Función para dividir texto en chunks
function splitTextIntoChunks(text: string, chunkSize: number, chunkOverlap: number): string[] {
  const chunks: string[] = [];
  let startIndex = 0;
  
  while (startIndex < text.length) {
    // Calcular el final del chunk actual
    let endIndex = startIndex + chunkSize;
    
    // Si no es el final del texto, intentar cortar en un espacio en blanco
    if (endIndex < text.length) {
      // Buscar el espacio más cercano a endIndex
      const nextSpaceIndex = text.indexOf(' ', endIndex);
      if (nextSpaceIndex !== -1 && nextSpaceIndex - endIndex < 100) {
        endIndex = nextSpaceIndex;
      }
    }
    
    // Añadir el chunk al array
    chunks.push(text.slice(startIndex, endIndex));
    
    // Mover el índice de inicio para el siguiente chunk
    startIndex = endIndex - chunkOverlap;
    
    // Asegurarse de que no nos quedemos atascados
    if (startIndex >= text.length || startIndex === endIndex) {
      break;
    }
  }
  
  return chunks;
}

// Manejador principal para procesar documentos
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Validate Supabase connection info
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase connection information");
      throw new Error("Missing Supabase URL or service role key. Please check your environment variables.");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Obtener datos de la solicitud
    let requestData;
    try {
      requestData = await req.json();
    } catch (error) {
      console.error("Error parsing request JSON:", error);
      throw new Error("Invalid JSON in request body");
    }
    
    const {
      chatbotId,
      text,
      fileName,
      fileType = 'text/plain',
      userId,
      retrievalSettings
    } = requestData;
    
    // Validate required parameters
    if (!chatbotId) {
      throw new Error("Missing required parameter: chatbotId");
    }
    if (!text) {
      throw new Error("Missing required parameter: text");
    }
    if (!fileName) {
      throw new Error("Missing required parameter: fileName");
    }
    if (!userId) {
      throw new Error("Missing required parameter: userId");
    }
    
    console.log(`Processing document for chatbot ${chatbotId}, userId: ${userId}`);
    console.log(`Filename: ${fileName}, fileType: ${fileType}`);
    
    // Obtener configuración de recuperación para el chatbot
    const settingsResponse = await supabase.rpc('get_retrieval_settings', {
      p_chatbot_id: chatbotId
    });
    
    if (settingsResponse.error) {
      console.error("Error al obtener configuración:", settingsResponse.error);
      throw new Error(`Error al obtener configuración: ${settingsResponse.error.message}`);
    }
    
    const settings = retrievalSettings || settingsResponse.data;
    const chunkSize = settings?.chunk_size || 1000;
    const chunkOverlap = settings?.chunk_overlap || 200;
    
    console.log(`Usando configuración: chunkSize=${chunkSize}, chunkOverlap=${chunkOverlap}`);
    
    // Verificar de nuevo si tenemos la clave de OpenAI antes de intentar generar embeddings
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "OpenAI API key not found. Please set the OPENAI_API_KEY environment variable."
        }),
        { 
          status: 500,
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json'
          } 
        }
      );
    }
    
    try {
      // Crear entrada para el documento principal
      const documentEmbedding = await getEmbeddings(text.slice(0, 8000));
      const documentMetadata = {
        type: fileType,
        source: fileType?.split('/')[0] || 'text',
        size: text.length,
        isChunk: false
      };
      
      const documentInsertResponse = await supabase
        .from('documents')
        .insert({
          chatbot_id: chatbotId,
          name: fileName,
          content: text.length > 10000 ? `${text.slice(0, 10000)}... (contenido truncado)` : text,
          embedding: documentEmbedding,
          metadata: documentMetadata,
          user_id: userId
        })
        .select()
        .single();
      
      if (documentInsertResponse.error) {
        console.error("Error al guardar documento:", documentInsertResponse.error);
        throw new Error(`Error al guardar documento: ${documentInsertResponse.error.message}`);
      }
      
      const documentId = documentInsertResponse.data.id;
      console.log(`Documento guardado con id ${documentId}`);
      
      // Dividir el contenido en chunks y procesar
      const chunks = splitTextIntoChunks(text, chunkSize, chunkOverlap);
      console.log(`Documento dividido en ${chunks.length} chunks`);
      
      // Procesar cada chunk en secuencia para evitar sobrecarga
      const chunkResults = [];
      let chunkIndex = 0;
      
      for (const chunk of chunks) {
        try {
          // Generar embedding para este chunk
          const embedding = await getEmbeddings(chunk);
          
          // Crear metadata para el chunk
          const chunkMetadata = {
            type: fileType,
            source: fileType?.split('/')[0] || 'text',
            isChunk: true,
            parentId: documentId,
            chunkIndex: chunkIndex,
            totalChunks: chunks.length
          };
          
          // Insertar el chunk en la base de datos
          const chunkResponse = await supabase
            .from('documents')
            .insert({
              chatbot_id: chatbotId,
              name: `${fileName} (fragmento ${chunkIndex + 1})`,
              content: chunk,
              embedding: embedding,
              metadata: chunkMetadata,
              user_id: userId
            });
          
          if (chunkResponse.error) {
            console.error(`Error al guardar chunk ${chunkIndex}:`, chunkResponse.error);
            chunkResults.push({ 
              index: chunkIndex, 
              success: false, 
              error: chunkResponse.error.message 
            });
          } else {
            chunkResults.push({ 
              index: chunkIndex, 
              success: true 
            });
          }
          
          chunkIndex++;
        } catch (chunkError) {
          console.error(`Error procesando chunk ${chunkIndex}:`, chunkError);
          chunkResults.push({ 
            index: chunkIndex, 
            success: false, 
            error: chunkError instanceof Error ? chunkError.message : String(chunkError)
          });
          chunkIndex++;
        }
      }
      
      console.log(`Procesamiento completado. ${chunkResults.filter(r => r.success).length}/${chunks.length} chunks guardados correctamente`);
      
      return new Response(
        JSON.stringify({
          success: true,
          documentId,
          totalChunks: chunks.length,
          processedChunks: chunkResults.filter(r => r.success).length,
          chunkResults
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json'
          } 
        }
      );
    } catch (processingError) {
      console.error('Error processing document:', processingError);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: processingError instanceof Error ? processingError.message : String(processingError)
        }),
        { 
          status: 500,
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json'
          } 
        }
      );
    }
  } catch (error) {
    console.error('Error en process-documents:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error)
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );
  }
});
