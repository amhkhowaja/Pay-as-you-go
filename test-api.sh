#!/bin/bash

# Comprehensive API Testing Script
# Usage: ./test-api.sh

ADMIN_USERNAME=${1:-admin}
ADMIN_PASSWORD=${2:-admin123}
USER_USERNAME=${3:-testuser}
USER_PASSWORD=${4:-test123}

KEYCLOAK_URL="http://localhost:8180"
REALM="payasyougo"
CLIENT_ID="frontend"

USER_SERVICE_URL="http://localhost:8081"
BILLING_SERVICE_URL="http://localhost:8080"
PAYMENT_SERVICE_URL="http://localhost:8082"

echo "=========================================="
echo "Getting Admin Access Token"
echo "=========================================="

ADMIN_TOKEN_RESPONSE=$(curl -s -X POST \
  "${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=${ADMIN_USERNAME}" \
  -d "password=${ADMIN_PASSWORD}" \
  -d "grant_type=password" \
  -d "client_id=${CLIENT_ID}")

ADMIN_TOKEN=$(echo $ADMIN_TOKEN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ADMIN_TOKEN" ]; then
  echo "❌ Failed to get admin token"
  echo "Response: $ADMIN_TOKEN_RESPONSE"
  exit 1
fi

echo "✅ Admin token obtained"
echo ""

echo "=========================================="
echo "Getting User Access Token"
echo "=========================================="

USER_TOKEN_RESPONSE=$(curl -s -X POST \
  "${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=${USER_USERNAME}" \
  -d "password=${USER_PASSWORD}" \
  -d "grant_type=password" \
  -d "client_id=${CLIENT_ID}")

USER_TOKEN=$(echo $USER_TOKEN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$USER_TOKEN" ]; then
  echo "❌ Failed to get user token"
  echo "Response: $USER_TOKEN_RESPONSE"
  exit 1
fi

echo "✅ User token obtained"
echo ""

# ==========================================
# ADMIN OPERATIONS
# ==========================================

echo "=========================================="
echo "[ADMIN] Create New Plan"
echo "=========================================="
NEW_PLAN_RESPONSE=$(curl -s -X POST ${BILLING_SERVICE_URL}/plans \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Plan",
    "price": 2999,
    "billingCycle": "MONTHLY"
  }')
echo "$NEW_PLAN_RESPONSE"
NEW_PLAN_ID=$(echo $NEW_PLAN_RESPONSE | grep -o '"timestamp":[0-9]*' | cut -d':' -f2)
echo ""

echo "=========================================="
echo "[ADMIN] List All Users"
echo "=========================================="
curl -s -X GET ${USER_SERVICE_URL}/user-service/users \
  -H "Authorization: Bearer ${ADMIN_TOKEN}"
echo -e "\n"

echo "=========================================="
echo "[ADMIN] Create New User"
echo "=========================================="
curl -s -X POST ${USER_SERVICE_URL}/user-service/users \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "keycloakUserId": "test-keycloak-id-'$(date +%s)'",
    "username": "testuser'$(date +%s)'",
    "email": "test'$(date +%s)'@example.com"
  }'
echo -e "\n"

# ==========================================
# USER OPERATIONS
# ==========================================

echo "=========================================="
echo "[USER] Get Current User Info"
echo "=========================================="
USER_INFO=$(curl -s -X GET ${USER_SERVICE_URL}/user-service/users/me \
  -H "Authorization: Bearer ${USER_TOKEN}")
echo "$USER_INFO"
USER_ID=$(echo $USER_INFO | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo ""

# ==========================================
# BILLING SERVICE - PLANS
# ==========================================

echo "=========================================="
echo "[USER] Get All Plans"
echo "=========================================="
PLANS_RESPONSE=$(curl -s -X GET ${BILLING_SERVICE_URL}/plans \
  -H "Authorization: Bearer ${USER_TOKEN}")
echo "$PLANS_RESPONSE"
echo ""

PLAN_ID=$(echo $PLANS_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$PLAN_ID" ]; then
  echo "=========================================="
  echo "[USER] Get Plan by ID: ${PLAN_ID}"
  echo "=========================================="
  curl -s -X GET ${BILLING_SERVICE_URL}/plans/${PLAN_ID} \
    -H "Authorization: Bearer ${USER_TOKEN}"
  echo -e "\n"
fi

# ==========================================
# BILLING SERVICE - SUBSCRIPTIONS
# ==========================================

echo "=========================================="
echo "[USER] Get All Subscriptions"
echo "=========================================="
curl -s -X GET ${BILLING_SERVICE_URL}/subscriptions \
  -H "Authorization: Bearer ${USER_TOKEN}"
echo -e "\n"

echo "=========================================="
echo "[USER] Create Subscription"
echo "=========================================="
if [ -n "$PLAN_ID" ] && [ -n "$USER_ID" ]; then
  SUBSCRIPTION_RESPONSE=$(curl -s -X POST ${BILLING_SERVICE_URL}/subscriptions \
    -H "Authorization: Bearer ${USER_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{
      "userId": "'${USER_ID}'",
      "serviceId": "premium-service",
      "planId": "'${PLAN_ID}'"
    }')
  echo "$SUBSCRIPTION_RESPONSE"
  SUBSCRIPTION_ID=$(echo $SUBSCRIPTION_RESPONSE | tr -d '"')
else
  echo "⚠️  Skipped - Missing plan ID or user ID"
  SUBSCRIPTION_RESPONSE=""
fi
echo ""

if [ -n "$USER_ID" ]; then
  echo "=========================================="
  echo "[USER] Get User Subscriptions"
  echo "=========================================="
  curl -s -X GET ${BILLING_SERVICE_URL}/subscriptions/user/${USER_ID} \
    -H "Authorization: Bearer ${USER_TOKEN}"
  echo -e "\n"
fi

# ==========================================
# PAYMENT SERVICE
# ==========================================

if [ -n "$SUBSCRIPTION_ID" ] && [ -n "$USER_ID" ]; then
  echo "=========================================="
  echo "[USER] Create Payment"
  echo "=========================================="
  curl -s -X POST ${PAYMENT_SERVICE_URL}/payments \
    -H "Authorization: Bearer ${USER_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{
      "userId": "'${USER_ID}'",
      "subscriptionId": "'${SUBSCRIPTION_ID}'",
      "amount": 2999,
      "currency": "usd"
    }'
  echo -e "\n"

  echo "=========================================="
  echo "[USER] Get Payment by Subscription ID"
  echo "=========================================="
  curl -s -X GET ${PAYMENT_SERVICE_URL}/payments/${SUBSCRIPTION_ID} \
    -H "Authorization: Bearer ${USER_TOKEN}"
  echo -e "\n"
else
  echo "=========================================="
  echo "[USER] Payment Tests Skipped"
  echo "=========================================="
  echo "⚠️  Missing subscription ID or user ID"
  echo ""
fi

# ==========================================
# WEBHOOK SIMULATION
# ==========================================

if [ -n "$SUBSCRIPTION_ID" ]; then
  echo "=========================================="
  echo "[WEBHOOK] Simulate Payment Success"
  echo "=========================================="
  curl -s -X POST ${BILLING_SERVICE_URL}/webhooks/payment-success \
    -H "Authorization: Bearer ${USER_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{
      "subscriptionId": "'${SUBSCRIPTION_ID}'"
    }'
  echo -e "\n"
fi

echo "=========================================="
echo "Testing Complete"
echo "=========================================="
