-- Create security audit log table
CREATE TABLE IF NOT EXISTS security_audit_log (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_event_type ON security_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_created_at ON security_audit_log(created_at);

-- Set up RLS policies for security_audit_log
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own audit logs
CREATE POLICY "Users can view their own security audit logs"
ON security_audit_log
FOR SELECT
USING (auth.uid() = user_id);

-- Only allow users to insert their own audit logs
CREATE POLICY "Users can insert their own security audit logs"
ON security_audit_log
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  event_type TEXT,
  details JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO security_audit_log (
    user_id,
    event_type,
    ip_address,
    user_agent,
    details
  ) VALUES (
    auth.uid(),
    event_type,
    nullif(current_setting('request.headers', true)::json->>'x-real-ip', ''),
    nullif(current_setting('request.headers', true)::json->>'user-agent', ''),
    details
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 