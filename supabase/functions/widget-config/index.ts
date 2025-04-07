import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.26.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, origin, referer, x-diagnostic-info, x-widget-diagnostic',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("[widget-config] Function called");
  console.log("[widget-config] Request method:", req.method);
  console.log("[widget-config] Request URL:", req.url);
  
  // Extract diagnostic information from headers
  const diagnosticInfo = req.headers.get('x-diagnostic-info') || req.headers.get('x-widget-diagnostic') || 'none';
  console.log("[widget-config] Diagnostic info:", diagnosticInfo);
  
  // Log all headers to debug authentication issues
  const headers = Object.fromEntries([...req.headers.entries()]);
  console.log("[widget-config] Request headers:", JSON.stringify(headers, null, 2));

  try {
    const url = new URL(req.url);
    const widgetId = url.searchParams.get('widget_id');
    const debug = url.searchParams.get('debug') === 'true';
    
    console.log(`[widget-config] Widget ID from request: ${widgetId}`);
    console.log(`[widget-config] Debug mode: ${debug}`);
    
    if (!widgetId) {
      console.error("[widget-config] Missing widget_id parameter");
      return new Response(
        JSON.stringify({ error: "Widget ID is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Initialize Supabase client with anon key for public access
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') as string;
    
    console.log(`[widget-config] Supabase URL: ${supabaseUrl ? "Set" : "Not set"}`);
    console.log(`[widget-config] Supabase Anon Key: ${supabaseAnonKey ? "Set" : "Not set"}`);
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("[widget-config] Missing Supabase environment variables");
      return new Response(
        JSON.stringify({ 
          error: "Server configuration error", 
          details: "Missing environment variables" 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    console.log(`[widget-config] Looking for widget with ID: ${widgetId}`);
    
    // Try multiple approaches to find the chatbot with specific widget ID
    let chatbot = null;
    let error = null;
    
    // 1. First approach: Try to find by widget_id directly with "eq" operation
    console.log("[widget-config] Method 1: Searching by widget_id with eq operation (JSON path)");
    let { data: widgetData, error: widgetError } = await supabase
      .from('chatbots')
      .select('id, name, description, share_settings')
      .eq('share_settings->widget_id', widgetId)
      .maybeSingle();
    
    if (!widgetError && widgetData) {
      chatbot = widgetData;
      console.log("[widget-config] Found widget by widget_id:", chatbot.id);
    } else {
      console.log("[widget-config] Not found by widget_id using eq. Error:", widgetError?.message);
      
      // 2. Try using a raw SQL query approach for more reliability
      console.log("[widget-config] Method 2: Using raw SQL query to find widget_id");
      const { data: sqlData, error: sqlError } = await supabase
        .rpc('find_widget_by_id', { widget_id_param: widgetId })
        .maybeSingle();
        
      if (!sqlError && sqlData) {
        console.log("[widget-config] Found widget using SQL function:", sqlData);
        
        // Get the full chatbot details
        const { data: chatbotData, error: chatbotError } = await supabase
          .from('chatbots')
          .select('id, name, description, share_settings')
          .eq('id', sqlData.chatbot_id)
          .single();
          
        if (!chatbotError && chatbotData) {
          chatbot = chatbotData;
        } else {
          console.log("[widget-config] Error getting chatbot details:", chatbotError?.message);
        }
      } else {
        console.log("[widget-config] SQL query didn't find widget. Error:", sqlError?.message);
      }
      
      // 3. Last fallback: Search directly by chatbot ID (in case widget_id is actually a chatbot ID)
      if (!chatbot) {
        console.log("[widget-config] Method 3: Searching directly by chatbot ID");
        const { data: directData, error: directError } = await supabase
          .from('chatbots')
          .select('id, name, description, share_settings')
          .eq('id', widgetId)
          .maybeSingle();
          
        if (!directError && directData) {
          chatbot = directData;
          console.log("[widget-config] Found widget by direct ID:", chatbot.id);
        } else {
          console.log("[widget-config] Not found by direct ID. Error:", directError?.message);
          
          // 4. Final approach: Search all enabled widgets manually
          console.log("[widget-config] Method 4: Manual search through all enabled widgets");
          const { data: allChatbots, error: allChatbotsError } = await supabase
            .from('chatbots')
            .select('id, name, description, share_settings')
            .not('share_settings', 'is', null);
            
          if (!allChatbotsError && allChatbots) {
            console.log(`[widget-config] Found ${allChatbots.length} chatbots with share_settings`);
            
            // Manually check each chatbot for matching widget_id
            for (const bot of allChatbots) {
              const botWidgetId = bot.share_settings?.widget_id;
              console.log(`[widget-config] Checking chatbot ${bot.id} with widget_id:`, botWidgetId);
              
              if (botWidgetId === widgetId) {
                chatbot = bot;
                console.log("[widget-config] Found widget in manual search:", chatbot.id);
                break;
              }
            }
          } else {
            console.log("[widget-config] Error searching all chatbots:", allChatbotsError?.message);
          }
            
          error = directError || widgetError;
        }
      }
    }
    
    if (!chatbot) {
      console.error("[widget-config] CRITICAL: Widget not found with any method:", error);
      
      // In debug mode, return more details
      if (debug) {
        return new Response(
          JSON.stringify({ 
            error: "Widget not found or not active", 
            details: error?.message,
            searchedId: widgetId,
            searchMethods: {
              method1: { result: "Not found", error: widgetError?.message },
              method3: { result: "Not found" }
            },
            tip: "Make sure the widget_id is correct and the widget is enabled in share_settings",
            diagnosticInfo: diagnosticInfo
          }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: "Widget not found or not active", 
          details: "The requested widget could not be found or is not enabled."
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log("[widget-config] Found chatbot:", chatbot.id, chatbot.name);
    console.log("[widget-config] Share settings:", JSON.stringify(chatbot.share_settings, null, 2));
    
    // Ensure share_settings exists and has minimum required structure
    if (!chatbot.share_settings) {
      chatbot.share_settings = {
        enabled: true,
        widget_id: widgetId
      };
    }
    
    // Check domain restrictions if any
    const referrer = req.headers.get('Referer') || '';
    let referrerDomain = '';
    
    try {
      if (referrer) {
        const referrerUrl = new URL(referrer);
        referrerDomain = referrerUrl.hostname;
      }
    } catch (e) {
      console.log("[widget-config] Error parsing referrer:", e);
    }
    
    console.log("[widget-config] Request referrer domain:", referrerDomain);
    
    const allowedDomains = chatbot.share_settings.restrictions?.allowed_domains || [];
    const hasDomainRestrictions = Array.isArray(allowedDomains) && allowedDomains.length > 0;
    
    console.log("[widget-config] Domain restrictions:", {
      hasDomainRestrictions,
      allowedDomains,
      referrerDomain
    });
    
    // Skip domain checking if preview URL or debug mode
    const isPreview = referrerDomain.includes('flashbot.lovable.app') || 
                      referrerDomain.includes('localhost') ||
                      debug;
    
    if (!isPreview && hasDomainRestrictions && referrerDomain) {
      // Check if the domain is allowed
      const isAllowed = allowedDomains.some(domain => 
        referrerDomain === domain || 
        referrerDomain.endsWith(`.${domain}`) ||
        domain === '*'
      );
      
      if (!isAllowed) {
        console.log("[widget-config] Domain not allowed:", referrerDomain);
        return new Response(
          JSON.stringify({ 
            error: "Domain not allowed", 
            details: `The widget can only be used on the configured domains`,
            allowedDomains
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // Prepare response (remove sensitive data)
    const response = {
      id: chatbot.id,
      name: chatbot.name,
      config: {
        appearance: chatbot.share_settings.appearance || {
          position: "right",
          theme: "light",
          initial_state: "closed",
          border_radius: 10,
          box_shadow: true
        },
        content: chatbot.share_settings.content || {
          title: "Chat Assistant",
          placeholder_text: "Type a message...",
          welcome_message: "Hello! How can I help you today?",
          branding: true
        },
        colors: chatbot.share_settings.colors || {
          primary: "#2563eb",
          secondary: "#f1f5f9",
          background: "#ffffff",
          text: "#333333",
          user_bubble: "#2563eb",
          bot_bubble: "#f1f5f9",
          links: "#2563eb"
        },
        behavior: chatbot.share_settings.behavior || {
          persist_conversation: true,
          auto_open: false,
          auto_open_delay: 0,
          save_conversation_id: false
        }
      }
    };
    
    console.log("[widget-config] Successfully returning widget config");
    
    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[widget-config] Error in widget-config:', error);
    
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        details: String(error),
        message: "Please check the Edge Function logs for details"
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
