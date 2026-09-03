#!/usr/bin/env bash
# ==============================================================================
# Yapper Discord-Compatible CI/CD Webhook Notification Script
# 
# Demonstrates sending rich CI/CD build notifications to Yapper exactly like Discord!
# Compatible with GitHub Actions, GitLab CI, CircleCI, Jenkins, etc.
# ==============================================================================

WEBHOOK_URL="${YAPPER_WEBHOOK_URL:-http://localhost:3000/api/webhooks/ci-builds/ci_token_secret_12345}"
STATUS="${1:-success}" # success or failure
BRANCH="${GITHUB_REF_NAME:-main}"
COMMIT="${GITHUB_SHA:-a8f23bc9}"
RUN_NUMBER="${GITHUB_RUN_NUMBER:-142}"

if [ "$STATUS" = "success" ]; then
  COLOR=65280 # 0x00FF00 Green
  EMOJI="✅"
  TITLE="CI Pipeline Succeeded: Build #${RUN_NUMBER}"
  DESC="All unit tests, static analysis, and multiplatform builds passed without errors."
else
  COLOR=16711680 # 0xFF0000 Red
  EMOJI="❌"
  TITLE="CI Pipeline Failed: Build #${RUN_NUMBER}"
  DESC="Build failed on compilation or automated test suite."
fi

PAYLOAD=$(cat <<EOF
{
  "username": "GitHub Actions",
  "avatar_url": "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png",
  "content": "${EMOJI} **Deployment Alert**: Build #${RUN_NUMBER} on branch \`${BRANCH}\` completed with status: **${STATUS^^}**",
  "embeds": [
    {
      "title": "${TITLE}",
      "description": "${DESC}",
      "url": "https://github.com/your-org/yapper/actions/runs/${RUN_NUMBER}",
      "color": ${COLOR},
      "fields": [
        {
          "name": "Branch",
          "value": "\`${BRANCH}\`",
          "inline": true
        },
        {
          "name": "Commit",
          "value": "[\`${COMMIT:0:7}\`](https://github.com/your-org/yapper/commit/${COMMIT})",
          "inline": true
        },
        {
          "name": "Triggered By",
          "value": "Push to \`main\`",
          "inline": true
        },
        {
          "name": "Environment",
          "value": "Production (Web, Android, iOS, Desktop)",
          "inline": false
        }
      ],
      "footer": {
        "text": "Yapper CI/CD Integration",
        "icon_url": "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
      },
      "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    }
  ]
}
EOF
)

echo "📡 Dispatching Discord-compatible CI Webhook to Yapper..."
curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD"

echo ""
echo "🎉 Webhook dispatched successfully!"
