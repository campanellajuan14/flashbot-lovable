
-- Creamos funciones RPC para evitar problemas de tipado con nuestras nuevas tablas
-- Función para obtener la configuración de WhatsApp del usuario
CREATE OR REPLACE FUNCTION public.get_user_whatsapp_config()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  SELECT row_to_json(config)
  INTO result
  FROM (
    SELECT *
    FROM user_whatsapp_config
    WHERE user_id = auth.uid()
  ) config;
  
  RETURN result;
END;
$$;

-- Función para actualizar el estado de activación de WhatsApp
CREATE OR REPLACE FUNCTION public.update_whatsapp_config_status(is_active_value boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE user_whatsapp_config
  SET 
    is_active = is_active_value,
    updated_at = now()
  WHERE user_id = auth.uid();
END;
$$;

-- Función para actualizar el chatbot activo para WhatsApp
CREATE OR REPLACE FUNCTION public.update_whatsapp_active_chatbot(chatbot_id_value uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE user_whatsapp_config
  SET 
    active_chatbot_id = chatbot_id_value,
    updated_at = now()
  WHERE user_id = auth.uid();
END;
$$;

-- Función para obtener mensajes de WhatsApp paginados
CREATE OR REPLACE FUNCTION public.get_whatsapp_messages(page_number int, page_size int)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
  total_count int;
BEGIN
  -- Obtener el recuento total
  SELECT COUNT(*)
  INTO total_count
  FROM whatsapp_messages
  WHERE user_id = auth.uid();

  -- Obtener los mensajes paginados
  SELECT json_build_object(
    'data', json_agg(m),
    'count', total_count
  )
  INTO result
  FROM (
    SELECT *
    FROM whatsapp_messages
    WHERE user_id = auth.uid()
    ORDER BY timestamp DESC
    LIMIT page_size
    OFFSET (page_number - 1) * page_size
  ) m;
  
  RETURN result;
END;
$$;
