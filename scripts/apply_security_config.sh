#!/bin/bash

# Apply Security Configuration Script
# This script applies all security configurations to your Supabase project

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Make sure the Supabase CLI is installed
if ! command -v supabase &> /dev/null
then
    echo -e "${RED}Error: Supabase CLI is not installed. Please install it first.${NC}"
    echo "See: https://supabase.com/docs/reference/cli/installing-and-updating"
    exit 1
fi

# Check if user is authenticated with Supabase
if ! supabase projects list &> /dev/null
then
    echo -e "${YELLOW}You need to login to Supabase CLI.${NC}"
    supabase login
fi

# Get project ID from config
PROJECT_ID=$(grep "project_id" ./supabase/config.toml | cut -d "=" -f2 | tr -d ' "')

if [ -z "$PROJECT_ID" ]
then
  echo -e "${RED}Error: Could not find project_id in supabase/config.toml${NC}"
  echo "Please ensure you have a valid project_id in your config file."
  exit 1
fi

echo -e "${BLUE}Starting security configuration for project: $PROJECT_ID ${NC}"

# Apply RLS policies
echo -e "${YELLOW}Applying Row Level Security policies...${NC}"
supabase db push -f ./sql/setup_rls_policies.sql

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ RLS policies applied successfully.${NC}"
else
  echo -e "${RED}✗ Failed to apply RLS policies.${NC}"
  exit 1
fi

# Create security audit log
echo -e "${YELLOW}Setting up security audit log...${NC}"
supabase db push -f ./sql/create_security_audit_log.sql

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Security audit log created successfully.${NC}"
else
  echo -e "${RED}✗ Failed to create security audit log.${NC}"
  exit 1
fi

# Apply network security settings
echo -e "${YELLOW}Setting up network security...${NC}"
supabase db push -f ./sql/network_security.sql

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Network security settings applied successfully.${NC}"
else
  echo -e "${RED}✗ Failed to apply network security settings.${NC}"
  exit 1
fi

# Update Supabase Auth settings
echo -e "${YELLOW}Updating Supabase Auth settings...${NC}"

# Enable email confirmations
echo -e "${YELLOW}Enabling email confirmations...${NC}"
supabase config set auth.email.enable_confirmations=true

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Email confirmations enabled.${NC}"
else
  echo -e "${RED}✗ Failed to enable email confirmations.${NC}"
  exit 1
fi

# Enable MFA
echo -e "${YELLOW}Enabling MFA...${NC}"
supabase config set auth.enable_mfa=true

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ MFA enabled.${NC}"
else
  echo -e "${RED}✗ Failed to enable MFA.${NC}"
  exit 1
fi

# Set reasonable JWT expiry
echo -e "${YELLOW}Setting JWT expiry...${NC}"
supabase config set auth.jwt_expiry=3600

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ JWT expiry set to 1 hour.${NC}"
else
  echo -e "${RED}✗ Failed to set JWT expiry.${NC}"
  exit 1
fi

# Enable SSL enforcement
echo -e "${YELLOW}Enabling SSL enforcement...${NC}"
supabase config set db.ssl_enforcement=true

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ SSL enforcement enabled.${NC}"
else
  echo -e "${RED}✗ Failed to enable SSL enforcement.${NC}"
  exit 1
fi

# Update Edge Functions to verify JWT
echo -e "${YELLOW}Updating Edge Functions to verify JWT...${NC}"
# Loop through all function folders
for func_dir in supabase/functions/*/; do
  func_name=$(basename "$func_dir")
  echo -e "${YELLOW}Setting verify_jwt=true for function: $func_name${NC}"
  
  # Skip the SQL directory which is not a function
  if [ "$func_name" == "sql" ]; then
    continue
  fi
  
  supabase config set functions.$func_name.verify_jwt=true
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ JWT verification enabled for $func_name.${NC}"
  else
    echo -e "${RED}✗ Failed to enable JWT verification for $func_name.${NC}"
  fi
done

echo -e "${BLUE}Deploying configuration changes...${NC}"
supabase db push

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Configuration changes deployed successfully.${NC}"
else
  echo -e "${RED}✗ Failed to deploy configuration changes.${NC}"
  exit 1
fi

echo -e "${GREEN}Security configuration completed successfully!${NC}"
echo -e "${YELLOW}Important manual steps:${NC}"
echo -e "1. Set up a custom SMTP server in the Supabase dashboard"
echo -e "2. Add additional organization owners for redundancy"
echo -e "3. Enable 2FA for your Supabase admin account"
echo -e "4. Consider adding IP restrictions in the Supabase dashboard"

exit 0 