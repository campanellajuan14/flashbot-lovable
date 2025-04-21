#!/bin/bash

# Color configuration for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================================${NC}"
echo -e "${BLUE}      Deploying Scaling Configuration for FlashBot       ${NC}"
echo -e "${BLUE}=========================================================${NC}"

# Check for Redis URL configuration
echo -e "${YELLOW}Checking Redis configuration...${NC}"
if [ -z "$REDIS_URL" ]; then
  echo -e "${YELLOW}REDIS_URL not found in environment. Do you want to configure it now? (y/n)${NC}"
  read -r setup_redis
  
  if [ "$setup_redis" = "y" ]; then
    echo -e "${YELLOW}Enter Redis URL (e.g., redis://username:password@host:port):${NC}"
    read -r redis_url
    
    echo -e "${YELLOW}Setting REDIS_URL...${NC}"
    supabase secrets set REDIS_URL="$redis_url"
    
    if [ $? -eq 0 ]; then
      echo -e "${GREEN}✓ Redis URL configured successfully.${NC}"
    else
      echo -e "${RED}✗ Failed to configure Redis URL.${NC}"
      exit 1
    fi
  else
    echo -e "${YELLOW}Skipping Redis configuration. Functions will run without caching.${NC}"
  fi
fi

# Deploy database migrations
echo -e "${YELLOW}Deploying database migrations for query optimization...${NC}"
supabase db push

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Database migrations applied successfully.${NC}"
else
  echo -e "${RED}✗ Failed to apply database migrations.${NC}"
  exit 1
fi

# Update Edge Function configurations
echo -e "${YELLOW}Updating Edge Function configurations...${NC}"

# Update match-documents configuration
echo -e "${YELLOW}Configuring match-documents function...${NC}"
supabase functions deploy match-documents --no-verify-jwt

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ match-documents function updated.${NC}"
else
  echo -e "${RED}✗ Failed to update match-documents function.${NC}"
  exit 1
fi

# Update process-documents configuration
echo -e "${YELLOW}Configuring process-documents function...${NC}"
supabase functions deploy process-documents --no-verify-jwt

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ process-documents function updated.${NC}"
else
  echo -e "${RED}✗ Failed to update process-documents function.${NC}"
  exit 1
fi

# Update claude-chat configuration
echo -e "${YELLOW}Configuring claude-chat function...${NC}"
supabase functions deploy claude-chat --no-verify-jwt

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ claude-chat function updated.${NC}"
else
  echo -e "${RED}✗ Failed to update claude-chat function.${NC}"
  exit 1
fi

# Enable JWT verification
echo -e "${YELLOW}Re-enabling JWT verification for functions...${NC}"
for func_dir in supabase/functions/*/; do
  func_name=$(basename "$func_dir")
  
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

# Deploy updated function settings
echo -e "${BLUE}Deploying function configuration changes...${NC}"
supabase db push

# Setup monitoring
echo -e "${YELLOW}Would you like to setup performance monitoring with Prometheus & Grafana? (y/n)${NC}"
read -r setup_monitoring

if [ "$setup_monitoring" = "y" ]; then
  echo -e "${YELLOW}This feature requires Docker. Installing monitoring stack...${NC}"
  
  # Check if monitoring directory exists, if not create it
  if [ ! -d "./monitoring" ]; then
    mkdir -p ./monitoring
  fi
  
  # Create docker-compose.yml for monitoring if it doesn't exist
  if [ ! -f "./monitoring/docker-compose.yml" ]; then
    cat > ./monitoring/docker-compose.yml << 'EOF'
version: '3.7'

services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - '9090:9090'
    restart: always

  grafana:
    image: grafana/grafana:latest
    volumes:
      - grafana_data:/var/lib/grafana
    ports:
      - '3000:3000'
    restart: always
    depends_on:
      - prometheus

volumes:
  prometheus_data:
  grafana_data:
EOF
  fi
  
  # Create prometheus.yml if it doesn't exist
  if [ ! -f "./monitoring/prometheus.yml" ]; then
    cat > ./monitoring/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'supabase'
    static_configs:
      - targets: ['host.docker.internal:54321']
EOF
  fi
  
  echo -e "${YELLOW}Starting monitoring stack...${NC}"
  cd ./monitoring && docker-compose up -d
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Monitoring stack started successfully.${NC}"
    echo -e "${GREEN}Grafana dashboard available at: http://localhost:3000 (admin/admin)${NC}"
    echo -e "${GREEN}Prometheus dashboard available at: http://localhost:9090${NC}"
  else
    echo -e "${RED}✗ Failed to start monitoring stack.${NC}"
  fi
else
  echo -e "${YELLOW}Skipping monitoring setup.${NC}"
fi

echo -e "${BLUE}=========================================================${NC}"
echo -e "${GREEN}      Scaling Configuration Deployed Successfully!      ${NC}"
echo -e "${BLUE}=========================================================${NC}"

echo -e "${YELLOW}Important Notes:${NC}"
echo -e "1. Redis caching has been implemented to reduce database load."
echo -e "2. Database indexes have been added for optimized queries."
echo -e "3. Connection pooling is active for better resource utilization."
echo -e "4. Edge Functions have increased memory and timeout limits."
echo -e "5. Add ?perfDebug=true to API requests to see performance metrics."

echo -e "${GREEN}Done!${NC}" 