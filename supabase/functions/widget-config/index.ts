
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

  try {
    const url = new URL(req.url);
    const widgetId = url.searchParams.get('widget_id');
    
    if (!widgetId) {
      return new Response(
        JSON.stringify({ error: "Se requiere widget_id" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') as string;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    console.log(`Looking for widget with ID: ${widgetId}`);
    
    // Get chatbot configuration
    const { data: chatbot, error } = await supabase
      .from('chatbots')
      .select('id, name, description, share_settings')
      .eq('share_settings->widget_id', widgetId)
      .eq('share_settings->enabled', true)
      .single();
    
    if (error || !chatbot) {
      console.error("Widget not found error:", error);
      return new Response(
        JSON.stringify({ error: "Widget no encontrado o no activo" }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Validate domain restriction if configured
    if (chatbot.share_settings?.restrictions?.allowed_domains?.length > 0) {
      const referer = req.headers.get('Referer');
      let isAllowed = false;
      
      if (referer) {
        const refererDomain = new URL(referer).hostname;
        isAllowed = chatbot.share_settings.restrictions.allowed_domains.some(domain => 
          refererDomain === domain || refererDomain.endsWith(`.${domain}`)
        );
      }
      
      if (!isAllowed) {
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
