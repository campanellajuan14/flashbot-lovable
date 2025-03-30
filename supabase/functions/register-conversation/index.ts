
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.14.0";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') as string;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // CORS handling
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversation_id, chatbot_id, messages, user_identifier } = await req.json();
    
    if (!conversation_id || !chatbot_id || !messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Registering conversation ${conversation_id} for chatbot ${chatbot_id} with ${messages.length} messages`);
    
    // Initialize Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Check if conversation exists
    const { data: existingConversation, error: conversationError } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversation_id)
      .single();
    
    if (conversationError && conversationError.code !== 'PGRST116') {
      // Real error (not just "no rows returned")
      console.error('Error checking existing conversation:', conversationError);
      throw new Error(`Database error: ${conversationError.message}`);
    }
    
    // If conversation doesn't exist, create it
    if (!existingConversation) {
      console.log(`Creating new conversation record with ID ${conversation_id}`);
      const { error: insertError } = await supabase.from('conversations').insert({
        id: conversation_id,
        chatbot_id,
        user_identifier: user_identifier || null,
        metadata: { source: 'widget' }
      });
      
      if (insertError) {
        console.error('Error creating conversation:', insertError);
        throw new Error(`Failed to create conversation: ${insertError.message}`);
      }
    } else {
      console.log(`Conversation ${conversation_id} already exists`);
    }
    
    // Get existing messages for this conversation to avoid duplicates
    const { data: existingMessages, error: messagesError } = await supabase
      .from('messages')
      .select('content, role')
      .eq('conversation_id', conversation_id);
    
    if (messagesError) {
      console.error('Error fetching existing messages:', messagesError);
      throw new Error(`Failed to fetch messages: ${messagesError.message}`);
    }
    
    // Create a map of existing messages for fast lookup
    const existingMap = new Map();
    if (existingMessages) {
      existingMessages.forEach(msg => {
        existingMap.set(`${msg.role}:${msg.content}`, true);
      });
    }
    
    // Filter out messages that already exist
    const newMessages = messages.filter(msg => 
      !existingMap.has(`${msg.role}:${msg.content}`)
    );
    
    console.log(`Found ${newMessages.length} new messages to insert`);
    
    // Insert new messages if any
    if (newMessages.length > 0) {
      const messagesToInsert = newMessages.map(msg => ({
        conversation_id,
        content: msg.content,
        role: msg.role,
        metadata: {}
      }));
      
      const { error: insertMessagesError } = await supabase
        .from('messages')
        .insert(messagesToInsert);
      
      if (insertMessagesError) {
        console.error('Error inserting messages:', insertMessagesError);
        throw new Error(`Failed to insert messages: ${insertMessagesError.message}`);
      }
      
      console.log(`Successfully inserted ${newMessages.length} messages`);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        conversation_id,
        new_messages: newMessages.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in register-conversation:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : String(error) 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
