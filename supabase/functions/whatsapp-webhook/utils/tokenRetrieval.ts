
/**
 * Improved token retrieval function that tries multiple methods
 */
export async function getWhatsAppToken(supabase: any, secretId: string): Promise<string | null> {
  console.log(`🔑 Intentando recuperar token de WhatsApp para secret_id: ${secretId}`);
  
  try {
    // Method 1: Try to get directly from user_whatsapp_tokens table
    try {
      console.log("🔍 Intentando recuperar token desde user_whatsapp_tokens...");
      const { data: tokenData, error: tokenError } = await supabase
        .from('user_whatsapp_tokens')
        .select('encrypted_token')
        .eq('id', secretId)
        .single();
        
      if (!tokenError && tokenData && tokenData.encrypted_token) {
        console.log("✅ Token recuperado exitosamente desde user_whatsapp_tokens");
        return tokenData.encrypted_token;
      } else {
        console.error("❓ No se encontró token en user_whatsapp_tokens:", tokenError?.message || "No hay datos");
      }
    } catch (dbError) {
      console.error("❌ Error accediendo a la base de datos:", dbError);
    }
    
    // Method 2: Get from secret_data in user_whatsapp_config
    try {
      console.log("🔍 Intentando recuperar token desde secret_data en user_whatsapp_config...");
      const { data: configData, error: configError } = await supabase
        .from('user_whatsapp_config')
        .select('secret_data')
        .eq('secret_id', secretId)
        .single();
        
      if (!configError && configData && configData.secret_data) {
        console.log("✅ Token recuperado exitosamente desde user_whatsapp_config.secret_data");
        return configData.secret_data;
      } else {
        console.error("❓ No se encontró token en secret_data:", configError?.message || "No hay datos");
      }
    } catch (backupError) {
      console.error("❌ Error en método alternativo:", backupError);
    }
    
    // Method 3: Try direct query with phone_number_id
    try {
      console.log("🔍 Intentando recuperar token mediante consulta directa por secret_id...");
      
      const { data: configWithToken, error: configTokenError } = await supabase
        .from('user_whatsapp_config')
        .select(`
          phone_number_id,
          user_whatsapp_tokens!inner(
            encrypted_token
          )
        `)
        .eq('secret_id', secretId)
        .single();
      
      if (!configTokenError && configWithToken?.user_whatsapp_tokens?.encrypted_token) {
        console.log("✅ Token recuperado exitosamente mediante join");
        return configWithToken.user_whatsapp_tokens.encrypted_token;
      } else {
        console.error("❓ No se encontró token mediante join:", configTokenError?.message || "No hay datos");
      }
    } catch (joinError) {
      console.error("❌ Error en consulta join:", joinError);
    }
    
    // Method 4: Try Vault as last resort if available (but don't rely on it)
    if (supabase.vault && typeof supabase.vault.decrypt === 'function') {
      try {
        console.log("🔍 Intentando recuperar token desde Vault...");
        const { data, error } = await supabase.vault.decrypt(secretId);
        
        if (!error && data) {
          console.log("✅ Token recuperado exitosamente desde Vault");
          return data;
        } else {
          console.error("❓ No se pudo recuperar token desde Vault:", error?.message || "Sin datos");
        }
      } catch (vaultError) {
        console.error("❌ Error accediendo a Vault:", vaultError);
      }
    } else {
      console.log("ℹ️ Vault no disponible en este entorno");
    }
    
    // Diagnostics: Get direct data about the secret ID
    try {
      console.log("🔍 Ejecutando diagnóstico de secret_id...");
      const { data: secretInfo, error: secretError } = await supabase
        .from('user_whatsapp_config')
        .select('id, user_id, secret_id, is_active')
        .eq('secret_id', secretId)
        .single();
        
      if (!secretError && secretInfo) {
        console.log(`ℹ️ Información del secret_id ${secretId}: ${JSON.stringify(secretInfo)}`);
      } else {
        console.error(`❌ No se encontró información para secret_id ${secretId}`);
      }
    } catch (diagError) {
      console.error("❌ Error en diagnóstico:", diagError);
    }
    
    // All methods failed
    console.error(`❌ Todos los métodos de recuperación del token fallaron para secret_id: ${secretId}`);
    return null;
    
  } catch (error) {
    console.error("❌ Error general en getWhatsAppToken:", error);
    return null;
  }
}
