
// Authentication and authorization utilities
import { corsHeaders } from "../config.ts";

/**
 * Check if the request is authorized based on auth header or other criteria
 */
export function isAuthorized(
  authHeader: string | null, 
  apiKey: string | null, 
  clientInfo: string | null, 
  origin: string,
  referer: string,
  source: string
): boolean {
  
  // Special widget authorization check
  // Allow requests from the widget preview page or with widget source
  const isWidgetRequest = 
    (clientInfo && (clientInfo.includes('widget') || clientInfo.includes('embed'))) || 
    referer.includes('widget') || 
    origin.includes('widget') ||
    apiKey === Deno.env.get('SUPABASE_ANON_KEY');
    
  // Allow requests from WhatsApp webhook function
  const isInternalRequest = 
    source === 'whatsapp-webhook' ||
    source === 'whatsapp_webhook' ||
    clientInfo?.includes('whatsapp') ||
    referer?.includes('whatsapp');
    
  console.log('- Is widget request:', isWidgetRequest);
  console.log('- Is internal (webhook) request:', isInternalRequest);

  return !!authHeader || isWidgetRequest || isInternalRequest;
}

/**
 * Generate an unauthorized response with appropriate headers
 */
export function generateUnauthorizedResponse(): Response {
  return new Response(JSON.stringify({
    error: 'Unauthorized',
    details: 'No valid authentication provided'
  }), {
    status: 401,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
