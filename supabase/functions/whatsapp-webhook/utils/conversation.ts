/**
 * Find or create a conversation for a user contacting a chatbot
 */
export async function findOrCreateConversation(
  supabase: any,
  chatbotId: string,
  userIdentifier: string,
  userName: string
) {
  console.log(`Finding/creating conversation for chatbot ${chatbotId} and user ${userIdentifier}`);
  
  try {
    // Try to find existing conversation for this number and chatbot
    const { data, error } = await supabase
      .from('conversations')
      .select()
      .eq('chatbot_id', chatbotId)
      .eq('user_identifier', userIdentifier)
      .order('created_at', { ascending: false })
      .limit(1);
    
    // If found, return the conversation
    if (!error && data && data.length > 0) {
      console.log(`Found existing conversation: ${data[0].id}`);
      return { data: data[0], error: null };
    }
    
    // If not found or error, create new conversation
    console.log("Creating new conversation");
    return await supabase
      .from('conversations')
      .insert({
        chatbot_id: chatbotId,
        user_identifier: userIdentifier,
        metadata: {
          source: 'whatsapp',
          name: userName
        }
      })
      .select()
      .single();
  } catch (error) {
    console.error("Error in findOrCreateConversation:", error);
    return { data: null, error };
  }
}

/**
 * Generate a random string of specified length for IDs, tracking, etc.
 */
export function getRandomString(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
