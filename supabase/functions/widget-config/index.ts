
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.26.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, origin, referer',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
  console.log("Request headers:", JSON.stringify(headers, null, 2));

  try {
    const url = new URL(req.url);
    const widgetId = url.searchParams.get('widget_id');
    
    console.log(`Widget ID from request: ${widgetId}`);
    
    if (!widgetId) {
      console.error("Missing widget_id parameter");
      return new Response(
        JSON.stringify({ error: "widget_id is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Initialize Supabase client with anon key for public access
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') as string;
    
    console.log(`Supabase URL: ${supabaseUrl ? "Set" : "Not set"}`);
    console.log(`Supabase Anon Key: ${supabaseAnonKey ? "Set" : "Not set"}`);
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    console.log(`Looking for widget with ID: ${widgetId}`);
    
    // Try multiple approaches to find the chatbot
    let chatbot = null;
    let error = null;
    
    // 1. Search by widget_id in share_settings
    console.log("Method 1: Searching by widget_id in share_settings");
    const { data: widgetData, error: widgetError } = await supabase
      .from('chatbots')
      .select('id, name, description, share_settings')
      .eq('share_settings->widget_id', widgetId)
      .single();
    
    if (!widgetError && widgetData) {
      chatbot = widgetData;
      console.log("Found widget by widget_id in share_settings:", chatbot.id);
    } else {
      console.log("Not found by widget_id in share_settings. Error:", widgetError?.message);
      
      // 2. Search directly by chatbot ID (in case widget_id is actually the chatbot ID)
      console.log("Method 2: Searching directly by chatbot ID");
      const { data: directData, error: directError } = await supabase
        .from('chatbots')
        .select('id, name, description, share_settings')
        .eq('id', widgetId)
        .single();
        
      if (!directError && directData) {
        chatbot = directData;
        console.log("Found widget by direct ID:", chatbot.id);
      } else {
        console.log("Not found by direct ID. Error:", directError?.message);
        
        // 3. Search by checking all chatbots with 'enabled' widgets for any matching widget_id
        console.log("Method 3: Searching all enabled widgets");
        const { data: allChatbots, error: allChatbotsError } = await supabase
          .from('chatbots')
          .select('id, name, description, share_settings')
          .eq('share_settings->enabled', true);
          
        if (!allChatbotsError && allChatbots) {
          console.log(`Found ${allChatbots.length} chatbots with enabled widgets`);
          
          for (const bot of allChatbots) {
            if (bot.share_settings?.widget_id === widgetId) {
              chatbot = bot;
              console.log("Found widget in enabled widgets list:", chatbot.id);
              break;
            }
          }
        } else {
          console.log("Error searching all chatbots:", allChatbotsError?.message);
        }
          
        error = directError || widgetError;
      }
    }
    
    if (!chatbot) {
      console.error("Widget not found with any method:", error);
      return new Response(
        JSON.stringify({ 
          error: "Widget not found or not active", 
          details: error?.message,
          searchedId: widgetId,
          tip: "Make sure the widget_id is correct and the widget is enabled in share_settings"
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log("Found chatbot:", chatbot.id, chatbot.name);
    console.log("Share settings:", JSON.stringify(chatbot.share_settings, null, 2));
    
    // Ensure share_settings exists and has minimum required structure
    if (!chatbot.share_settings) {
      chatbot.share_settings = {
        enabled: true
      };
    }
    
    // IMPORTANT: Make widget publicly accessible without auth
    // This is a public endpoint that should work for any visitor
    
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
    
    console.log("Successfully returning widget config");
    
    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in widget-config:', error);
    
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
