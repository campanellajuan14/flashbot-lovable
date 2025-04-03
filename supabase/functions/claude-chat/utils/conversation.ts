
// Conversation management utilities
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.14.0";
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from "../config.ts";
import { Message } from "../types.ts";

/**
 * Register or verify a conversation
 */
export async function handleConversation(
  conversationId: string | null | undefined,
  chatbotId: string | undefined,
  source: string | undefined,
  widget_id: string | undefined,
  user_identifier: string | undefined,
  messages: Message[],
  responseText: string
) {
  if (!chatbotId) {
    return { conversationId: conversationId || crypto.randomUUID() };
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  // Generate or use provided conversation ID
  const generatedConversationId = conversationId || crypto.randomUUID();

  // If we're generating a new conversation ID (not using an existing one),
  // register it in the database to ensure it's properly tracked
  if (!conversationId && chatbotId) {
    console.log(`[AutoReg] Attempting auto-registration for chatbot ${chatbotId}. New Conversation ID: ${generatedConversationId}`);
    try {
      console.log(`[AutoReg] Checking if conversation ${generatedConversationId} already exists.`);
      // Check if conversation already exists (shouldn't, but being safe)
      const { data: existingConv, error: checkError } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', generatedConversationId)
        .maybeSingle();

      if (checkError) {
         console.error(`[AutoReg] Error checking for existing conversation ${generatedConversationId}:`, checkError);
      } else {
         console.log(`[AutoReg] Existing conversation check for ${generatedConversationId}: Found = ${!!existingConv}`);
      }
        
      // Only proceed if no error during check AND conversation doesn't exist
      if (!checkError && !existingConv) { 
        console.log(`[AutoReg] Attempting to insert new conversation record ${generatedConversationId}...`);
        // Insert the new conversation record
        const { error: insertError } = await supabase
          .from('conversations')
          .insert({
            id: generatedConversationId,
            chatbot_id: chatbotId,
            user_identifier: user_identifier || 'anonymous',
            metadata: { 
              source: source || 'api',
              widget_id: widget_id || null,
              auto_registered: true
            }
          });
          
        if (insertError) {
          console.error(`[AutoReg] FAILED to insert conversation ${generatedConversationId}:`, insertError);
        } else {
          console.log(`[AutoReg] SUCCESS inserting conversation ${generatedConversationId}.`);
          
          // Also register initial messages
          if (messages && Array.isArray(messages) && messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            const messagesToInsert = [
              {
                conversation_id: generatedConversationId,
                content: lastMessage.content,
                role: lastMessage.role,
                metadata: {}
              },
              {
                conversation_id: generatedConversationId,
                content: responseText,
                role: 'assistant',
                metadata: {}
              }
            ];

            console.log(`[AutoReg] Attempting to insert ${messagesToInsert.length} initial messages for conversation ${generatedConversationId}...`);
            
            const { error: messagesError } = await supabase
              .from('messages')
              .insert(messagesToInsert);
              
            if (messagesError) {
              console.error(`[AutoReg] FAILED to insert initial messages for ${generatedConversationId}:`, messagesError);
            } else {
              console.log(`[AutoReg] SUCCESS inserting initial messages for ${generatedConversationId}.`);
            }
          }
        }
      } else if (!checkError && existingConv) {
        console.log(`[AutoReg] Skipped inserting conversation ${generatedConversationId} because it already exists.`);
      }
    } catch (regError) {
      console.error(`[AutoReg] CRITICAL ERROR during auto-registration block for conversation ${generatedConversationId}:`, regError);
      // Continue despite error - don't block the response
    }
  }
  
  return { conversationId: generatedConversationId };
}

/**
 * Log message metrics for analysis
 */
export async function logMessageMetrics(chatbotId: string | undefined, lastUserMessage: string, relevantDocumentsCount: number, outputTokens: number | undefined) {
  if (!chatbotId) return;
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    await supabase.from('message_metrics').insert({
      chatbot_id: chatbotId,
      query: lastUserMessage,
      has_documents: relevantDocumentsCount > 0,
      document_count: relevantDocumentsCount,
      message_tokens: outputTokens || 0,
      created_at: new Date().toISOString()
    });
  } catch (metricsError) {
    console.error("Error logging message metrics:", metricsError);
  }
}
