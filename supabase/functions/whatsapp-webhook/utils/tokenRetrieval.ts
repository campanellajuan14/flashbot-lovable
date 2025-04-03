
/**
 * Improved token retrieval function that tries multiple methods
 */
export async function getWhatsAppToken(supabase: any, secretId: string): Promise<string | null> {
  console.log(`Attempting to retrieve WhatsApp token for secret ID: ${secretId}`);
  let token = null;

  try {
    // Method 1: Try to get from Vault first (if available)
    if (supabase.vault && typeof supabase.vault.decrypt === 'function') {
      try {
        console.log("Attempting to retrieve token from Vault...");
        const { data, error } = await supabase.vault.decrypt(secretId);
        
        if (!error && data) {
          console.log("Successfully retrieved API token from Vault");
          return data;
        } else {
          console.error("Failed to retrieve token from Vault:", error);
        }
      } catch (vaultError) {
        console.error("Vault access error:", vaultError);
      }
    } else {
      console.log("Vault not available, skipping Vault token retrieval");
    }
    
    // Method 2: Try to get directly from user_whatsapp_tokens table
    try {
      console.log("Attempting to retrieve token from user_whatsapp_tokens table...");
      const { data: tokenData, error: tokenError } = await supabase
        .from('user_whatsapp_tokens')
        .select('encrypted_token')
        .eq('id', secretId)
        .single();
        
      if (!tokenError && tokenData && tokenData.encrypted_token) {
        console.log("Successfully retrieved API token from user_whatsapp_tokens table");
        return tokenData.encrypted_token;
      } else {
        console.error("Error retrieving token from user_whatsapp_tokens table:", tokenError);
      }
    } catch (dbError) {
      console.error("Database access error:", dbError);
    }
    
    // Method 3: Fallback - try direct query from user_whatsapp_config table
    try {
      console.log("Attempting to retrieve token from secret_data in user_whatsapp_config...");
      const { data: configData, error: configError } = await supabase
        .from('user_whatsapp_config')
        .select('secret_data')
        .eq('secret_id', secretId)
        .single();
        
      if (!configError && configData && configData.secret_data) {
        console.log("Successfully retrieved API token from user_whatsapp_config");
        return configData.secret_data;
      } else {
        console.error("Error retrieving token from user_whatsapp_config:", configError);
      }
    } catch (backupError) {
      console.error("Backup token retrieval error:", backupError);
    }
    
    // All methods failed
    console.error("All token retrieval methods failed");
    return null;
    
  } catch (error) {
    console.error("Error in getWhatsAppToken:", error);
    return null;
  }
}
