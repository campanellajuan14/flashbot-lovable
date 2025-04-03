
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
        .select('encrypted_token, created_at')
        .eq('id', secretId)
        .single();
        
      if (!tokenError && tokenData && tokenData.encrypted_token) {
        // Usar created_at como respaldo
        const lastUpdated = tokenData.created_at || 'desconocido';
        console.log(`✅ Token recuperado exitosamente desde user_whatsapp_tokens (creado: ${lastUpdated})`);
        
        // Verificar la antigüedad del token (más de 60 días = advertencia)
        if (lastUpdated !== 'desconocido') {
          const tokenDate = new Date(lastUpdated);
          const daysDiff = Math.floor((Date.now() - tokenDate.getTime()) / (1000 * 3600 * 24));
          
          if (daysDiff > 60) {
            console.warn(`⚠️ El token tiene ${daysDiff} días de antigüedad, podría estar cerca de expirar`);
          }
        }
        
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
        .select('secret_data, updated_at')
        .eq('secret_id', secretId)
        .single();
        
      if (!configError && configData && configData.secret_data) {
        console.log(`✅ Token recuperado exitosamente desde user_whatsapp_config.secret_data (actualizado: ${configData.updated_at || 'desconocido'})`);
        
        // Verificar la antigüedad del token (más de 60 días = advertencia)
        if (configData.updated_at) {
          const tokenDate = new Date(configData.updated_at);
          const daysDiff = Math.floor((Date.now() - tokenDate.getTime()) / (1000 * 3600 * 24));
          
          if (daysDiff > 60) {
            console.warn(`⚠️ El token tiene ${daysDiff} días de antigüedad, podría estar cerca de expirar`);
          }
        }
        
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
      
      // Consulta directa sin usar updated_at que puede no existir
      const { data: configWithToken, error: configTokenError } = await supabase
        .from('user_whatsapp_config')
        .select(`
          phone_number_id,
          user_whatsapp_tokens!inner(
            encrypted_token,
            created_at
          )
        `)
        .eq('secret_id', secretId)
        .single();
      
      if (!configTokenError && configWithToken?.user_whatsapp_tokens?.encrypted_token) {
        // Usar created_at como respaldo
        const lastUpdated = configWithToken.user_whatsapp_tokens.created_at || 'desconocido';
        
        console.log(`✅ Token recuperado exitosamente mediante join (creado: ${lastUpdated})`);
        
        // Verificar la antigüedad del token si hay fecha
        if (lastUpdated !== 'desconocido') {
          const tokenDate = new Date(lastUpdated);
          const daysDiff = Math.floor((Date.now() - tokenDate.getTime()) / (1000 * 3600 * 24));
          
          if (daysDiff > 60) {
            console.warn(`⚠️ El token tiene ${daysDiff} días de antigüedad, podría estar cerca de expirar`);
          }
        }
        
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
        .select('id, user_id, secret_id, is_active, updated_at')
        .eq('secret_id', secretId)
        .single();
        
      if (!secretError && secretInfo) {
        console.log(`ℹ️ Información del secret_id ${secretId}: ${JSON.stringify(secretInfo)}`);
        
        // Verificar última actualización
        if (secretInfo.updated_at) {
          const configDate = new Date(secretInfo.updated_at);
          const daysDiff = Math.floor((Date.now() - configDate.getTime()) / (1000 * 3600 * 24));
          console.log(`ℹ️ La configuración se actualizó hace ${daysDiff} días`);
        }
      } else {
        console.error(`❌ No se encontró información para secret_id ${secretId}`);
      }
    } catch (diagError) {
      console.error("❌ Error en diagnóstico:", diagError);
    }
    
    // Last attempt: Check if there's a token directly in secret_data with no filtering
    try {
      console.log("🔍 Último intento: buscando token en secret_data sin filtros...");
      
      const { data: lastResortConfig, error: lastResortError } = await supabase
        .from('user_whatsapp_config')
        .select('secret_data')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
        
      if (!lastResortError && lastResortConfig && lastResortConfig.secret_data) {
        console.log("⚠️ Usando token de secret_data más reciente como último recurso");
        return lastResortConfig.secret_data;
      } else {
        console.error("❌ No se encontró token en secret_data:", lastResortError?.message || "No hay datos");
      }
    } catch (lastError) {
      console.error("❌ Error en último intento:", lastError);
    }
    
    // All methods failed
    console.error(`❌ Todos los métodos de recuperación del token fallaron para secret_id: ${secretId}`);
    return null;
    
  } catch (error) {
    console.error("❌ Error general en getWhatsAppToken:", error);
    return null;
  }
}

/**
 * Verifica la validez de un token de WhatsApp
 */
export async function verifyWhatsAppToken(token: string, phoneNumberId: string): Promise<boolean> {
  try {
    console.log(`🔍 Verificando validez del token para el phone_number_id ${phoneNumberId}...`);
    
    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      console.log(`✅ Token válido para el phone_number_id ${phoneNumberId}`);
      return true;
    } else {
      const errorData = await response.text();
      try {
        const errorJson = JSON.parse(errorData);
        console.error(`❌ Error verificando token: ${JSON.stringify(errorJson)}`);
      } catch {
        console.error(`❌ Error verificando token: ${errorData}`);
      }
      
      return false;
    }
  } catch (error) {
    console.error(`❌ Error en verificación de token:`, error);
    return false;
  }
}
