
// Configuration and environment variables

// API URLs and keys
export const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
export const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
export const SUPABASE_URL = Deno.env.get('SUPABASE_URL') as string;
export const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') as string;
export const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;

// CORS headers for cross-origin requests
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Default model settings
export const defaultSettings = {
  model: 'claude-3-haiku-20240307',
  temperature: 0.7,
  maxTokens: 1000
};
