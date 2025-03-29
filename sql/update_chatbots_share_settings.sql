
-- Add share_settings column to chatbots table if it doesn't exist
ALTER TABLE chatbots ADD COLUMN IF NOT EXISTS share_settings JSONB DEFAULT '{}';
