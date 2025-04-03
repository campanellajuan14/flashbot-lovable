
-- Add a column to store token data directly in user_whatsapp_config if needed
ALTER TABLE IF EXISTS public.user_whatsapp_config 
ADD COLUMN IF NOT EXISTS secret_data TEXT;

-- Create a dedicated table for encrypted tokens if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_whatsapp_tokens (
  id UUID PRIMARY KEY REFERENCES public.user_whatsapp_config(secret_id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  encrypted_token TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add RLS policies to protect the tokens table
ALTER TABLE IF EXISTS public.user_whatsapp_tokens ENABLE ROW LEVEL SECURITY;

-- Only allow admins and service role to access this table
CREATE POLICY IF NOT EXISTS "Service role can access all tokens" ON public.user_whatsapp_tokens
  USING (true)
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
