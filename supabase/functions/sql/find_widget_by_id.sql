-- Function to find chatbots by widget_id
-- This is more reliable than JsonPath queries in some cases
CREATE OR REPLACE FUNCTION find_widget_by_id(widget_id_param TEXT)
RETURNS TABLE (
  chatbot_id UUID,
  widget_id TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id AS chatbot_id,
    c.share_settings->>'widget_id' AS widget_id
  FROM 
    chatbots c
  WHERE 
    c.share_settings->>'widget_id' = widget_id_param
  LIMIT 1;
END;
$$; 