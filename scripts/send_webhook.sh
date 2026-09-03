#!/usr/bin/env bash
# Yapper Incoming Webhook Notification Script
# Demonstrates sending rich message payloads to Yapper via Discord-compatible Webhook API

set -e

WEBHOOK_URL="${1:-http://localhost:3000/api/webhooks/general/webhook_secret_token_123}"
MESSAGE="${2:-Hello team! This is a test message sent via the Yapper Webhook API.}"

echo "📡 Dispatching webhook to: $WEBHOOK_URL"

curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "Status Bot",
    "avatar_url": "https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/bot.svg",
    "content": "'"$MESSAGE"'",
    "embeds": [
      {
        "title": "System Notification",
        "description": "Integration webhook successfully triggered.",
        "color": 3901686,
        "fields": [
          {"name": "Environment", "value": "Production", "inline": true},
          {"name": "Status", "value": "Healthy", "inline": true}
        ],
        "footer": {
          "text": "Yapper Integration API"
        },
        "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
      }
    ]
  }'

echo ""
echo "✅ Webhook successfully sent!"
