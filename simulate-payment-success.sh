#!/bin/bash

# Simulate Payment Success
# Usage: ./simulate-payment-success.sh <subscription-id>

SUBSCRIPTION_ID=${1}

if [ -z "$SUBSCRIPTION_ID" ]; then
  echo "Usage: ./simulate-payment-success.sh <subscription-id>"
  echo ""
  echo "Get subscription ID from: curl http://localhost:8080/subscriptions"
  exit 1
fi

echo "=========================================="
echo "Simulating Payment Success"
echo "Subscription ID: $SUBSCRIPTION_ID"
echo "=========================================="

# Get access token
TOKEN_RESPONSE=$(curl -s -X POST \
  "http://localhost:8180/realms/payasyougo/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=testuser" \
  -d "password=test123" \
  -d "grant_type=password" \
  -d "client_id=frontend")

ACCESS_TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

# Call the webhook endpoint
curl -X POST http://localhost:8080/webhooks/payment-success \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"subscriptionId\": \"$SUBSCRIPTION_ID\"}"

echo ""
echo ""
echo "=========================================="
echo "Checking Subscription Status"
echo "=========================================="

curl -s http://localhost:8080/subscriptions \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" | grep -A 5 "$SUBSCRIPTION_ID"

echo ""
