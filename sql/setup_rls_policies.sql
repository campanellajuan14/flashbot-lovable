-- Enable Row Level Security on all tables

-- Enable RLS on all tables
ALTER TABLE chatbot_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbots ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_whatsapp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for chatbot_permissions
CREATE POLICY "Users can view their own chatbot permissions"
ON public.chatbot_permissions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chatbot permissions"
ON public.chatbot_permissions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chatbot permissions"
ON public.chatbot_permissions
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chatbot permissions"
ON public.chatbot_permissions
FOR DELETE
USING (auth.uid() = user_id);

-- Create RLS policies for chatbots
CREATE POLICY "Users can view their own chatbots"
ON public.chatbots
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chatbots"
ON public.chatbots
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chatbots"
ON public.chatbots
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chatbots"
ON public.chatbots
FOR DELETE
USING (auth.uid() = user_id);

-- Create RLS policies for documents
CREATE POLICY "Users can view their own documents"
ON public.documents
FOR SELECT
USING (auth.uid() IN (
  SELECT user_id FROM chatbots WHERE id = documents.chatbot_id
));

CREATE POLICY "Users can insert documents to their chatbots"
ON public.documents
FOR INSERT
WITH CHECK (auth.uid() IN (
  SELECT user_id FROM chatbots WHERE id = documents.chatbot_id
));

CREATE POLICY "Users can update their own documents"
ON public.documents
FOR UPDATE
USING (auth.uid() IN (
  SELECT user_id FROM chatbots WHERE id = documents.chatbot_id
))
WITH CHECK (auth.uid() IN (
  SELECT user_id FROM chatbots WHERE id = documents.chatbot_id
));

CREATE POLICY "Users can delete their own documents"
ON public.documents
FOR DELETE
USING (auth.uid() IN (
  SELECT user_id FROM chatbots WHERE id = documents.chatbot_id
));

-- Create RLS policies for user_whatsapp_config
CREATE POLICY "Users can view their own WhatsApp config"
ON public.user_whatsapp_config
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own WhatsApp config"
ON public.user_whatsapp_config
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own WhatsApp config"
ON public.user_whatsapp_config
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own WhatsApp config"
ON public.user_whatsapp_config
FOR DELETE
USING (auth.uid() = user_id);

-- Create RLS policies for whatsapp_messages
CREATE POLICY "Users can view their own WhatsApp messages"
ON public.whatsapp_messages
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own WhatsApp messages"
ON public.whatsapp_messages
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own WhatsApp messages"
ON public.whatsapp_messages
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own WhatsApp messages"
ON public.whatsapp_messages
FOR DELETE
USING (auth.uid() = user_id);

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create policies for public access to certain features
CREATE POLICY "Public can view published chatbots"
ON public.chatbots
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM chatbot_permissions 
    WHERE chatbot_id = chatbots.id 
    AND permission = 'public_read'
  )
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_chatbots_user_id ON chatbots(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_chatbot_id ON documents(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_permissions_chatbot_id ON chatbot_permissions(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_permissions_user_id ON chatbot_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_user_id ON whatsapp_messages(user_id); 