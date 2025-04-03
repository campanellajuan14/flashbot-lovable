
import { supabase } from './client';

interface WhatsAppConfig {
  phone_number_id?: string;
  secret_id?: string;
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

/**
 * Obtiene las plantillas de WhatsApp disponibles
 * @returns Lista de plantillas de WhatsApp
 */
export async function getWhatsAppTemplates(): Promise<WhatsAppTemplate[]> {
  try {
    console.log("Iniciando obtención de plantillas de WhatsApp");
    
    // Obtenemos la configuración de WhatsApp actual
    const { data: configData, error: configError } = await supabase.rpc<WhatsAppConfig>('get_user_whatsapp_config');
    
    if (configError) {
      console.error('Error obteniendo configuración WhatsApp:', configError);
      throw new Error('No hay configuración de WhatsApp disponible');
    }
    
    if (!configData) {
      console.error('No se encontró configuración de WhatsApp');
      throw new Error('No hay configuración de WhatsApp disponible');
    }
    
    const config = configData as WhatsAppConfig;
    
    if (!config.phone_number_id) {
      console.error('Configuración de WhatsApp incompleta:', config);
      throw new Error('No hay phone_number_id en la configuración de WhatsApp');
    }

    console.log(`Configuración WhatsApp encontrada para phone_number_id: ${config.phone_number_id}`);
    
    // Obtenemos la sesión actual para la autorización
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.error('No hay sesión activa');
      throw new Error('No hay sesión activa');
    }
    
    // Llamamos a la función whatsapp-api-proxy usando el endpoint completo
    console.log("Llamando a whatsapp-api-proxy para obtener plantillas");
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
      console.error(`Error HTTP ${response.status} obteniendo plantillas:`, errorText);
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(`Error obteniendo plantillas: ${errorJson.error || errorText}`);
      } catch (e) {
        throw new Error(`Error obteniendo plantillas: ${errorText}`);
      }
    }
    
    const result = await response.json();
    console.log(`Plantillas obtenidas correctamente: ${result.data?.length || 0} plantillas`);
    
    if (!result.data || !Array.isArray(result.data)) {
      console.warn("No se encontraron plantillas o formato incorrecto:", result);
      return [];
    }
    
    return result.data;
  } catch (error) {
    console.error('Error obteniendo plantillas de WhatsApp:', error);
    throw error;
  }
}

/**
 * Envía una plantilla de WhatsApp al número especificado
 * @param toNumber Número de teléfono del destinatario
 * @param templateName Nombre de la plantilla
 * @param language Código de idioma (default: "es_ES")
 * @param components Componentes opcionales para personalizar la plantilla
 * @returns Objeto con el ID del mensaje enviado
 */
export async function sendWhatsAppTemplate(
  toNumber: string, 
  templateName: string, 
  language: string = "es_ES", 
  components: any[] = []
): Promise<{id: string}> {
  try {
    console.log(`Enviando plantilla "${templateName}" a ${toNumber}`);
    
    // Obtenemos la configuración de WhatsApp actual
    const { data: configData, error: configError } = await supabase.rpc<WhatsAppConfig>('get_user_whatsapp_config');
    
    if (configError || !configData) {
      console.error('Error obteniendo configuración de WhatsApp:', configError);
      throw new Error('No hay configuración de WhatsApp disponible');
    }
    
    const config = configData as WhatsAppConfig;
    
    if (!config.phone_number_id) {
      console.error('Configuración incompleta:', config);
      throw new Error('No hay phone_number_id en la configuración de WhatsApp');
    }
    
    console.log(`Usando phone_number_id: ${config.phone_number_id}`);
    
    // Preparamos los datos para el token
    if (!config.secret_id) {
      console.error('No hay secret_id configurado');
      throw new Error('Configuración de WhatsApp incompleta: falta secret_id');
    }
    
    // Obtenemos la sesión actual para la autorización
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.error('No hay sesión activa');
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
    
    console.log("Llamando a whatsapp-api-proxy para enviar plantilla", {
      action: 'messages',
      phone_number_id: config.phone_number_id,
      template: templateName
    });
    
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
      console.error(`Error HTTP ${response.status} enviando plantilla:`, errorText);
      
      // Intentar mostrar más detalles del error
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error && errorJson.error.includes("inválido o expirado")) {
          throw new Error("El token de WhatsApp ha expirado o es inválido. Por favor, actualiza el token en la configuración de WhatsApp.");
        }
        throw new Error(`Error enviando plantilla: ${errorJson.error || errorText}`);
      } catch (e) {
        if (e instanceof Error) {
          throw e; // Rethrow el error ya procesado
        }
        throw new Error(`Error enviando plantilla: ${errorText}`);
      }
    }
    
    const result = await response.json();
    console.log("Respuesta del envío de plantilla:", result);
    
    if (!result.messages || !result.messages[0]) {
      throw new Error('No se recibió ID de mensaje');
    }
    
    return { id: result.messages[0].id };
  } catch (error) {
    console.error('Error enviando plantilla de WhatsApp:', error);
    throw error;
  }
}

/**
 * Envía un mensaje de texto simple por WhatsApp
 * @param toNumber Número de teléfono del destinatario
 * @param text Texto del mensaje
 * @returns Objeto con el ID del mensaje enviado
 */
export async function sendWhatsAppTextMessage(
  toNumber: string,
  text: string
): Promise<{id: string}> {
  try {
    console.log(`Enviando mensaje de texto a ${toNumber}`);
    
    // Obtenemos la configuración de WhatsApp
    const { data: configData, error: configError } = await supabase.rpc<WhatsAppConfig>('get_user_whatsapp_config');
    
    if (configError || !configData) {
      console.error('Error obteniendo configuración de WhatsApp:', configError);
      throw new Error('No hay configuración de WhatsApp disponible');
    }
    
    const config = configData as WhatsAppConfig;
    
    if (!config.phone_number_id) {
      console.error('Configuración incompleta:', config);
      throw new Error('No hay phone_number_id en la configuración de WhatsApp');
    }
    
    // Obtenemos la sesión actual para la autorización
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.error('No hay sesión activa');
      throw new Error('No hay sesión activa');
    }
    
    console.log("Enviando payload:", {
      action: 'messages',
      params: {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: toNumber,
        type: "text",
        text: {
          preview_url: false,
          body: text
        }
      }
    });
    
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
          type: "text",
          text: {
            preview_url: false,
            body: text
          }
        }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error HTTP ${response.status} enviando mensaje:`, errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error && errorJson.error.includes("inválido o expirado")) {
          throw new Error("El token de WhatsApp ha expirado o es inválido. Por favor, actualiza el token en la configuración de WhatsApp.");
        }
        throw new Error(`Error enviando mensaje: ${errorJson.error || errorText}`);
      } catch (e) {
        if (e instanceof Error) {
          throw e; // Rethrow el error ya procesado
        }
        throw new Error(`Error enviando mensaje: ${errorText}`);
      }
    }
    
    const result = await response.json();
    console.log("Respuesta del envío de mensaje:", result);
    
    if (!result.messages || !result.messages[0]) {
      throw new Error('No se recibió ID de mensaje');
    }
    
    return { id: result.messages[0].id };
  } catch (error) {
    console.error('Error enviando mensaje de texto por WhatsApp:', error);
    throw error;
  }
}
