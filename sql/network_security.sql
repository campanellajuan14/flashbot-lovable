-- Network Security Settings
-- This script sets up IP restrictions and function-level security

-- Create extension for IP matching if not exists
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "ip4r";

-- Create table for storing allowed IP ranges
CREATE TABLE IF NOT EXISTS security_allowed_ips (
  id SERIAL PRIMARY KEY,
  ip_range CIDR NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create function to check if IP is allowed
CREATE OR REPLACE FUNCTION is_ip_allowed(client_ip TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- If no IP ranges are set, allow all (fallback)
  IF NOT EXISTS (SELECT 1 FROM security_allowed_ips LIMIT 1) THEN
    RETURN TRUE;
  END IF;
  
  -- Check if IP is in allowed ranges
  RETURN EXISTS (
    SELECT 1
    FROM security_allowed_ips
    WHERE client_ip::INET <<= ip_range
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to block excessive login attempts
CREATE OR REPLACE FUNCTION check_login_attempts()
RETURNS TRIGGER AS $$
DECLARE
  max_attempts INT := 5; -- Maximum failed login attempts
  lockout_minutes INT := 15; -- Lockout duration in minutes
  recent_attempts INT;
BEGIN
  -- Count recent failed attempts from the same IP
  SELECT COUNT(*) INTO recent_attempts
  FROM auth.audit_log_entries
  WHERE 
    event = 'login' 
    AND ip_address = request.headers('x-real-ip')
    AND result = 'error'
    AND created_at > now() - interval '15 minutes';
    
  -- If too many attempts, block the request
  IF recent_attempts >= max_attempts THEN
    RAISE EXCEPTION 'Too many login attempts. Please try again later.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for login attempts
DROP TRIGGER IF EXISTS check_login_attempts_trigger ON auth.users;
CREATE TRIGGER check_login_attempts_trigger
BEFORE UPDATE ON auth.users
FOR EACH ROW
WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
EXECUTE FUNCTION check_login_attempts();

-- Create MFA requirement for admin users
CREATE OR REPLACE FUNCTION require_mfa_for_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the user has admin role and doesn't have MFA enabled
  IF NEW.role = 'admin' AND NOT EXISTS (
    SELECT 1 FROM auth.factors WHERE user_id = NEW.id AND status = 'verified'
  ) THEN
    -- For new admin users, just set a flag or notify
    -- For existing users converting to admin, we can enforce stricter
    -- This example just adds a warning, but you could require MFA setup
    RAISE WARNING 'Admin user % does not have MFA enabled', NEW.email;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for admin MFA requirement
DROP TRIGGER IF EXISTS admin_mfa_trigger ON public.profiles;
CREATE TRIGGER admin_mfa_trigger
AFTER INSERT OR UPDATE OF role ON public.profiles
FOR EACH ROW
WHEN (NEW.role = 'admin')
EXECUTE FUNCTION require_mfa_for_admin();

-- Create a log table for security events
CREATE TABLE IF NOT EXISTS security_audit_log (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_event_type ON security_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_created_at ON security_audit_log(created_at);

-- Function to log security events
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
    request.headers('x-real-ip'),
    request.headers('user-agent'),
    details
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 