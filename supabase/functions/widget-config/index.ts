
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
  const headers = Object.fromEntries([...req.headers.entries()]);
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
    // This allows the function to work without authentication
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') as string;
    
    console.log(`Supabase URL: ${supabaseUrl ? "Set" : "Not set"}`);
    console.log(`Supabase Anon Key: ${supabaseAnonKey ? "Set" : "Not set"}`);
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing Supabase environment variables");
      return new Response(
        JSON.stringify({ 
          error: "Server configuration error", 
          details: "Missing environment variables" 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    console.log(`Looking for widget with ID: ${widgetId}`);
    
    // Try multiple approaches to find the chatbot
    let chatbot = null;
    let error = null;
    
    // 1. First try: Direct match based on widget_id in share_settings
    console.log("Method 1: Direct widget_id match in share_settings");
    const { data: directMatchData, error: directMatchError } = await supabase
      .from('chatbots')
      .select('id, name, description, share_settings')
      .filter('share_settings->widget_id', 'eq', widgetId)
      .single();
      
    if (!directMatchError && directMatchData) {
      chatbot = directMatchData;
      console.log("Found widget by direct match in share_settings:", chatbot.id);
    } else {
      console.log("Not found by direct match. Error:", directMatchError?.message);
      
      // 2. Second try: Looking directly by chatbot ID
      console.log("Method 2: Searching directly by chatbot ID");
      const { data: chatbotIdData, error: chatbotIdError } = await supabase
        .from('chatbots')
        .select('id, name, description, share_settings')
        .eq('id', widgetId)
        .single();
        
      if (!chatbotIdError && chatbotIdData) {
        chatbot = chatbotIdData;
        console.log("Found widget by direct chatbot ID:", chatbot.id);
      } else {
        console.log("Not found by chatbot ID. Error:", chatbotIdError?.message);
        
        // 3. Third try: Get all enabled widgets and check manually
        console.log("Method 3: Searching all enabled chatbots");
        const { data: allChatbots, error: allChatbotsError } = await supabase
          .from('chatbots')
          .select('id, name, description, share_settings')
          .filter('share_settings->enabled', 'eq', true);
        
        if (!allChatbotsError && allChatbots && allChatbots.length > 0) {
          console.log(`Found ${allChatbots.length} chatbots with enabled widgets`);
          
          // Loop through each chatbot and check if widget_id matches
          for (const bot of allChatbots) {
            console.log(`Checking chatbot ${bot.id} with share_settings:`, JSON.stringify(bot.share_settings));
            
            if (bot.share_settings && bot.share_settings.widget_id === widgetId) {
              chatbot = bot;
              console.log("Found widget in enabled widgets list:", chatbot.id);
              break;
            }
          }
        } else {
          console.error("Error getting all chatbots:", allChatbotsError?.message);
        }
        
        // Remember the errors
        error = chatbotIdError || directMatchError || allChatbotsError;
      }
    }
    
    if (!chatbot) {
      console.error("Widget not found with any method:", error);
      
      // Return detailed error to help debugging
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
        enabled: true,
        widget_id: widgetId
      };
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
