
import { supabase } from './client';

interface WhatsAppConfig {
  phone_number_id?: string;
  [key: string]: any;
}

export interface WhatsAppTemplate {
  name: string;
  language: string;
  status: string;
  category?: string;
  components?: Array<{
    type: string;
    text?: string;
    format?: string;
    components?: Array<any>;
  }>;
}

export async function getWhatsAppTemplates(): Promise<WhatsAppTemplate[]> {
  try {
    // Obtenemos la configuración de WhatsApp actual
    const { data: configData, error: configError } = await supabase.rpc<WhatsAppConfig>('get_user_whatsapp_config');
    
    if (configError || !configData) {
      throw new Error('No hay configuración de WhatsApp disponible');
    }
    
    const config = configData as WhatsAppConfig;
    
    if (!config || !config.phone_number_id) {
      throw new Error('No hay phone_number_id en la configuración de WhatsApp');
    }
    
    // Obtenemos la sesión actual para la autorización
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No hay sesión activa');
    }
    
    // Llamamos a la función whatsapp-api-proxy usando el endpoint completo
    const response = await fetch('https://obiiomoqhpbgaymfphdz.supabase.co/functions/v1/whatsapp-api-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': supabase.supabaseKey
      },
      body: JSON.stringify({
        action: 'message_templates',
        phone_number_id: config.phone_number_id,
        params: {
          limit: 100
        }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(`Error obteniendo plantillas: ${errorJson.error || errorText}`);
      } catch (e) {
        throw new Error(`Error obteniendo plantillas: ${errorText}`);
      }
    }
    
    const result = await response.json();
    
    if (!result.data || !Array.isArray(result.data)) {
      return [];
    }
    
    return result.data;
  } catch (error) {
    console.error('Error obteniendo plantillas de WhatsApp:', error);
    throw error;
  }
}

export async function sendWhatsAppTemplate(
  toNumber: string, 
  templateName: string, 
  language: string = "es_ES", 
  components: any[] = []
): Promise<{id: string}> {
  try {
    // Obtenemos la configuración de WhatsApp actual
    const { data: configData, error: configError } = await supabase.rpc<WhatsAppConfig>('get_user_whatsapp_config');
    
    if (configError || !configData) {
      throw new Error('No hay configuración de WhatsApp disponible');
    }
    
    const config = configData as WhatsAppConfig;
    
    if (!config || !config.phone_number_id) {
      throw new Error('No hay phone_number_id en la configuración de WhatsApp');
    }
    
    // Obtenemos la sesión actual para la autorización
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No hay sesión activa');
    }
    
    // Preparar los datos de la plantilla
    const templateData = {
      name: templateName,
      language: {
        code: language
      }
    };
    
    // Añadir componentes si existen
    if (components && components.length > 0) {
      templateData['components'] = components;
    }
    
    // Llamamos a la función whatsapp-api-proxy
    const response = await fetch('https://obiiomoqhpbgaymfphdz.supabase.co/functions/v1/whatsapp-api-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': supabase.supabaseKey
      },
      body: JSON.stringify({
        action: 'messages',
        phone_number_id: config.phone_number_id,
        params: {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: toNumber,
          type: "template",
          template: templateData
        }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(`Error enviando plantilla: ${errorJson.error || errorText}`);
      } catch (e) {
        throw new Error(`Error enviando plantilla: ${errorText}`);
      }
    }
    
    const result = await response.json();
    
    if (!result.messages || !result.messages[0]) {
      throw new Error('No se recibió ID de mensaje');
    }
    
    return { id: result.messages[0].id };
  } catch (error) {
    console.error('Error enviando plantilla de WhatsApp:', error);
    throw error;
  }
}
