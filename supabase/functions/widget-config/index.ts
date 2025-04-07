// @deno-types="npm:@supabase/functions-js/src/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

// Define types (adjusted for potential nullability)
interface ShareSettings {
  widget_id?: string | null;
  appearance?: Record<string, any> | null;
  content?: Record<string, any> | null;
  colors?: Record<string, any> | null;
  behavior?: Record<string, any> | null;
  restrictions?: { allowed_domains?: string[] | null } | null;
  enabled?: boolean | null;
}

interface Chatbot {
  id: string;
  name: string;
  description?: string | null;
  share_settings?: ShareSettings | null;
}

// RPC result type (adjust based on your actual SQL function output)
interface FindWidgetResult {
    chatbot_id: string;
    // Add other columns returned by the RPC if any
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, origin, referer, x-diagnostic-info, x-widget-diagnostic',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

// Type guard for Supabase errors
function isSupabaseError(error: any): error is { message: string } {
  return error && typeof error.message === 'string';
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const diagnosticInfo = req.headers.get('x-diagnostic-info') || req.headers.get('x-widget-diagnostic') || 'none';
  console.log(`[widget-config] Start | Diagnostic: ${diagnosticInfo}`);

  try {
    const url = new URL(req.url);
    const widgetId = url.searchParams.get('widget_id');
    const debug = url.searchParams.get('debug') === 'true';
    
    if (!widgetId) {
      console.error("[widget-config] Error: Missing widget_id parameter");
      return new Response(JSON.stringify({ error: "Widget ID is required" }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("[widget-config] Error: Missing Supabase environment variables");
      return new Response(JSON.stringify({ error: "Server configuration error" }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    console.log(`[widget-config] Looking for widget ID: ${widgetId}`);
    
    let chatbot: Chatbot | null = null;
    let sqlErrorMsg: string | null = null;
    let eqErrorMsg: string | null = null;
    let foundByMethod = 'none';

    // --- Method 1: SQL function find_widget_by_id ---
    console.log("[widget-config] Attempting Method 1: SQL function find_widget_by_id");
    try {
        // Correctly type the RPC call result
        const { data: rpcData, error: rpcError } = await supabase
            .rpc<'find_widget_by_id', FindWidgetResult>('find_widget_by_id', { widget_id_param: widgetId })
            .maybeSingle();

        if (rpcError) {
            sqlErrorMsg = `RPC Error: ${rpcError.message}`;
            console.warn("[widget-config] Method 1 Failed (RPC Error):", sqlErrorMsg);
        } else if (rpcData && rpcData.chatbot_id) {
            console.log("[widget-config] Method 1 Success: Found chatbot_id:", rpcData.chatbot_id);
            const { data: chatbotData, error: fetchError } = await supabase
                .from('chatbots')
                .select('id, name, description, share_settings')
                .eq('id', rpcData.chatbot_id)
                .single<Chatbot>();

            if (fetchError) {
                sqlErrorMsg = `Fetch Error after RPC: ${fetchError.message}`;
                console.error("[widget-config] Method 1 Error (Fetch Details):", sqlErrorMsg);
            } else if (chatbotData) {
                chatbot = chatbotData;
                foundByMethod = 'sql_function';
                console.log("[widget-config] Method 1 Success: Retrieved full chatbot details.");
            } else {
                 sqlErrorMsg = "SQL function found ID but chatbot details query returned null.";
                 console.warn("[widget-config] Method 1 Warning:", sqlErrorMsg);
            }
        } else {
            sqlErrorMsg = "SQL function did not find a matching widget ID or returned null.";
            console.log("[widget-config] Method 1 Result: No match found by SQL function.");
        }
    } catch (rpcCatchError) {
        sqlErrorMsg = `Caught Exception (RPC): ${rpcCatchError instanceof Error ? rpcCatchError.message : String(rpcCatchError)}`;
        console.error("[widget-config] Method 1 Exception:", sqlErrorMsg);
    }

    // --- Method 2: Fallback to JSONB eq operator ---
    if (!chatbot) {
        console.log("[widget-config] Attempting Method 2: JSONB eq operator (share_settings->>widget_id)");
        try {
             // Ensure the column name and operator are correct PostgreSQL syntax
            const { data: eqData, error: queryError } = await supabase
                .from('chatbots')
                .select('id, name, description, share_settings')
                .eq('share_settings::jsonb->>widget_id' as 'widget_id', widgetId) // Corrected cast
                .maybeSingle<Chatbot>();

            if (queryError) {
                eqErrorMsg = `Query Error: ${queryError.message}`;
                console.warn("[widget-config] Method 2 Failed (Query Error):", eqErrorMsg);
            } else if (eqData) {
                chatbot = eqData;
                foundByMethod = 'jsonb_eq';
                console.log("[widget-config] Method 2 Success: Found widget using jsonb_eq.");
            } else {
                eqErrorMsg = "jsonb_eq operator did not find a match or returned null.";
                console.log("[widget-config] Method 2 Result: No match found by jsonb_eq.");
            }
        } catch (eqCatchError) {
             eqErrorMsg = `Caught Exception (EQ): ${eqCatchError instanceof Error ? eqCatchError.message : String(eqCatchError)}` ;
             console.error("[widget-config] Method 2 Exception:", eqErrorMsg);
        }
    }

    // --- Handle Not Found --- 
    if (!chatbot) {
      const lastErrorMsg = eqErrorMsg || sqlErrorMsg || "Widget not found after all attempts";
      console.error(`[widget-config] CRITICAL FAILURE: Widget not found (Searched ID: ${widgetId}). Last error: ${lastErrorMsg}`);
      
      const errorResponse = {
        error: "Widget not found or not active",
        details: debug ? `Failed methods. SQL: ${sqlErrorMsg ?? 'No Error/Match'}. EQ: ${eqErrorMsg ?? 'No Error/Match'}.` : "Could not find enabled widget.",
        ...(debug && { 
            searchedId: widgetId, 
            methodsAttempted: { sql_function: sqlErrorMsg ?? 'OK/No Match', jsonb_eq: eqErrorMsg ?? 'OK/No Match' },
            diagnosticInfo 
        })
      };
      return new Response(JSON.stringify(errorResponse), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    // --- Found Chatbot - Proceed ---
    console.log(`[widget-config] Success: Found chatbot by ${foundByMethod}. ID: ${chatbot.id}, Name: ${chatbot.name}`);
    console.log("[widget-config] Raw share_settings:", JSON.stringify(chatbot.share_settings, null, 2));

    // --- Domain Restriction Check ---
    const checkDomainRestrictions = () => {
        const referrer = req.headers.get('Referer') || '';
        let referrerDomain = '';
        try { if (referrer) referrerDomain = new URL(referrer).hostname; } catch { console.warn("[widget-config] Could not parse referrer URL:", referrer); }
        const allowedDomains = chatbot?.share_settings?.restrictions?.allowed_domains || [];
        const hasRestrictions = Array.isArray(allowedDomains) && allowedDomains.length > 0;
        const isPreview = referrerDomain.includes('flashbot.lovable.app') || referrerDomain.includes('localhost') || debug;

        if (!isPreview && hasRestrictions && referrerDomain) {
            const isAllowed = allowedDomains.some(domain => 
                referrerDomain === domain || referrerDomain.endsWith(`.${domain}`) || domain === '*'
            );
            if (!isAllowed) {
                console.warn("[widget-config] Domain check FAILED:", { referrerDomain, allowedDomains });
                return { allowed: false, message: "Domain not allowed", details: `Widget use restricted on this domain.`, allowedDomains };
            }
        }
        console.log("[widget-config] Domain check PASSED:", { referrerDomain, hasRestrictions, isPreview });
        return { allowed: true };
    };
    const domainCheck = checkDomainRestrictions();
    if (!domainCheck.allowed) {
         return new Response(JSON.stringify({ error: domainCheck.message, details: domainCheck.details, allowedDomains: domainCheck.allowedDomains }),
           { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // --- Prepare and Send Response ---
    const responsePayload = {
      id: chatbot.id,
      name: chatbot.name,
      config: chatbot.share_settings || {} // Pass raw settings, frontend handles defaults
    };
    console.log("[widget-config] Sending Success Response (Payload Snippet):", JSON.stringify(responsePayload).substring(0, 300) + "...");

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error("[widget-config] CRITICAL Unhandled Exception:", err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: "Internal Server Error", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
