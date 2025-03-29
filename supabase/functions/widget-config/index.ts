
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.26.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("widget-config function called");
  console.log("Request method:", req.method);
  console.log("Request URL:", req.url);
  
  // Log all headers to debug authentication issues
  const headers = Object.fromEntries([...new Headers(req.headers)]);
  console.log("Request headers:", JSON.stringify(headers));

  try {
    const url = new URL(req.url);
    const widgetId = url.searchParams.get('widget_id');
    
    console.log(`Widget ID from request: ${widgetId}`);
    
    if (!widgetId) {
      console.error("Missing widget_id parameter");
      return new Response(
        JSON.stringify({ error: "Se requiere widget_id" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Initialize Supabase client - using anon key for public access
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') as string;
    
    console.log(`Supabase URL: ${supabaseUrl ? "Set" : "Not set"}`);
    console.log(`Supabase Anon Key: ${supabaseAnonKey ? "Set" : "Not set"}`);
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    console.log(`Looking for widget with ID: ${widgetId}`);
    
    // Get chatbot configuration - importantly, we only look for widgets with enabled=true
    // First try the standard format (UUID)
    let query = supabase
      .from('chatbots')
      .select('id, name, description, share_settings')
      .eq('share_settings->widget_id', widgetId);
      
    let { data: chatbot, error } = await query.single();
    
    // If not found, try to query directly by ID as fallback (for direct ID references)
    if (error || !chatbot) {
      console.log("Widget not found by widget_id parameter, trying direct ID");
      const { data: directChatbot, error: directError } = await supabase
        .from('chatbots')
        .select('id, name, description, share_settings')
        .eq('id', widgetId)
        .single();
        
      if (directError || !directChatbot) {
        console.error("Widget not found with either method:", error || directError);
        return new Response(
          JSON.stringify({ error: "Widget no encontrado o no activo" }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      chatbot = directChatbot;
    }
    
    console.log("Found chatbot:", chatbot.id, chatbot.name);
    console.log("Share settings:", JSON.stringify(chatbot.share_settings));
    
    // Verify that widget is enabled, if not, it's NOT publicly available
    if (!chatbot.share_settings?.enabled) {
      console.error(`Widget is not enabled: ${widgetId}`);
      return new Response(
        JSON.stringify({ error: "Widget no está activo" }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Validate domain restriction if configured
    if (chatbot.share_settings?.restrictions?.allowed_domains?.length > 0) {
      const referer = req.headers.get('Referer');
      let isAllowed = false;
      
      console.log(`Referer header: ${referer}`);
      console.log(`Allowed domains: ${JSON.stringify(chatbot.share_settings.restrictions.allowed_domains)}`);
      
      // Special allowances for testing environments
      if (!referer || referer.includes('localhost') || referer.includes('127.0.0.1') || referer.includes('lovable.app')) {
        console.log("Development/testing environment detected, allowing access");
        isAllowed = true;
      } else {
        const refererDomain = new URL(referer).hostname;
        isAllowed = chatbot.share_settings.restrictions.allowed_domains.some(domain => 
          refererDomain === domain || refererDomain.endsWith(`.${domain}`)
        );
        
        console.log(`Referer domain: ${refererDomain}, Is allowed: ${isAllowed}`);
      }
      
      if (!isAllowed) {
        console.error(`Domain not allowed for widget: ${widgetId}`);
        return new Response(
          JSON.stringify({ error: "Dominio no autorizado" }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // Prepare response (remove sensitive data)
    const response = {
      id: chatbot.id,
      name: chatbot.name,
      config: {
        appearance: chatbot.share_settings.appearance,
        content: chatbot.share_settings.content,
        colors: chatbot.share_settings.colors,
        behavior: chatbot.share_settings.behavior
      }
    };
    
    console.log("Successfully returning widget config");
    
    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in widget-config:', error);
    
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
