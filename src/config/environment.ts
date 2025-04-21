/**
 * Centralized environment configuration
 * Provides type-safe access to environment variables with validation
 */

// Default environment variables - overridden by .env files
const defaultConfig = {
  // Supabase Configuration
  SUPABASE_URL: "https://obiiomoqhpbgaymfphdz.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iaWlvbW9xaHBiZ2F5bWZwaGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3NjIyNTUsImV4cCI6MjA1MzMzODI1NX0.JAtEJ3nJucemX7rQd1I0zlTBGAVsNQ_SPGiULmjwfXY",
  
  // API Configuration
  API_BASE_URL: "https://obiiomoqhpbgaymfphdz.supabase.co/functions/v1",
  
  // Redis Configuration (for caching)
  REDIS_URL: "",
  
  // OpenAI Configuration
  OPENAI_API_KEY: "",
  
  // Application Configuration
  APP_ENV: "development",
  DEBUG_MODE: "false",
  
  // Network Configuration
  CORS_ORIGINS: "*",
  
  // Performance Configuration
  CACHE_TTL: "300", // 5 minutes in seconds
  CONNECTION_TIMEOUT: "5000", // 5 seconds in milliseconds
  MAX_RETRIES: "3"
};

// Environment variable validation rules and access
type EnvVar = keyof typeof defaultConfig;

/**
 * Get environment variable with validation and fallback
 * @param key Environment variable name
 * @returns Environment variable value or default
 */
export function getEnvVar(key: EnvVar): string {
  // Browser environment - try to get from window.__ENV__ (injected via server)
  if (typeof window !== 'undefined' && window.__ENV__ && window.__ENV__[key]) {
    return window.__ENV__[key];
  }
  
  // Node/Deno environment - try to get from process.env or Deno.env
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] as string;
    } else if (typeof Deno !== 'undefined' && Deno.env && Deno.env.get(key)) {
      return Deno.env.get(key) as string;
    }
  } catch (e) {
    // Ignore errors trying to access Node/Deno environments
  }
  
  // Fallback to default
  return defaultConfig[key];
}

// Export config as an object for easy access
export const env = {
  supabase: {
    url: getEnvVar('SUPABASE_URL'),
    anonKey: getEnvVar('SUPABASE_ANON_KEY')
  },
  api: {
    baseUrl: getEnvVar('API_BASE_URL')
  },
  redis: {
    url: getEnvVar('REDIS_URL')
  },
  openai: {
    apiKey: getEnvVar('OPENAI_API_KEY')
  },
  app: {
    env: getEnvVar('APP_ENV'),
    debug: getEnvVar('DEBUG_MODE') === 'true'
  },
  network: {
    corsOrigins: getEnvVar('CORS_ORIGINS')
  },
  performance: {
    cacheTtl: parseInt(getEnvVar('CACHE_TTL')),
    connectionTimeout: parseInt(getEnvVar('CONNECTION_TIMEOUT')),
    maxRetries: parseInt(getEnvVar('MAX_RETRIES'))
  }
};

// Declare global window type with __ENV__ property
declare global {
  interface Window {
    __ENV__?: Record<string, string>;
  }
}

export default env; 