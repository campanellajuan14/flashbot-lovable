-- Add indexes to improve query performance for document retrieval
-- Adds proper indexes for vector similarity search and other common query patterns

-- Create index for chatbot documents by chatbot_id
CREATE INDEX IF NOT EXISTS idx_documents_chatbot_id ON documents (chatbot_id);

-- Create index for similarity search on embedding column
-- This improves vector similarity queries which are expensive
CREATE INDEX IF NOT EXISTS idx_documents_embedding_vector_cosine
ON documents
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Add index for retrieval settings
CREATE INDEX IF NOT EXISTS idx_retrieval_settings_chatbot_id ON retrieval_settings (chatbot_id);

-- Add index for message history
CREATE INDEX IF NOT EXISTS idx_message_history_conversation_id ON message_history (conversation_id);
CREATE INDEX IF NOT EXISTS idx_message_history_timestamp ON message_history (timestamp);

-- Add composite index for conversation lookups
CREATE INDEX IF NOT EXISTS idx_conversations_chatbot_user ON conversations (chatbot_id, user_id);

-- Add index for chat widgets by owner
CREATE INDEX IF NOT EXISTS idx_chat_widgets_owner_id ON chat_widgets (owner_id);

-- Analyze tables to update statistics for query planner
ANALYZE documents;
ANALYZE retrieval_settings;
ANALYZE message_history;
ANALYZE conversations;
ANALYZE chat_widgets; 