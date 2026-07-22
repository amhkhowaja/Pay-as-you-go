#!/bin/bash

set -e

echo "=========================================="
echo "Pay-As-You-Go SaaS - Keycloak SSO Setup"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Starting Keycloak and services...${NC}"
docker-compose up -d keycloak mongodb

echo -e "${BLUE}Waiting for Keycloak to be ready...${NC}"
until curl -sf http://localhost:8180/realms/payasyougo > /dev/null 2>&1; do
  echo "Waiting for Keycloak..."
  sleep 5
done

echo -e "${GREEN}✓ Keycloak is ready${NC}"

echo -e "${BLUE}Building microservices...${NC}"
./build.sh

echo -e "${BLUE}Starting all services...${NC}"
docker-compose up -d

echo ""
echo -e "${GREEN}=========================================="
echo "Setup Complete!"
echo "==========================================${NC}"
echo ""
echo "Services:"
echo "  - Keycloak Admin: http://localhost:8180/admin"
echo "    Username: admin"
echo "    Password: admin"
echo ""
echo "  - Frontend: http://localhost:3000"
echo "  - User Service: http://localhost:8081"
echo "  - Billing Service: http://localhost:8080"
echo "  - Payment Service: http://localhost:8082"
echo ""
echo "Test Users:"
echo "  Admin - username: admin, password: admin123"
echo "  User  - username: testuser, password: test123"
echo ""
echo "Realm: payasyougo"
echo ""
