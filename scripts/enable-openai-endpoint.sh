#!/bin/bash
# Enable OpenAI-compatible Chat Completions endpoint for OpenClaw Gateway
# This allows real Agent communication via /v1/chat/completions

CONFIG_FILE="$HOME/.openclaw/openclaw.json"
BACKUP_FILE="$HOME/.openclaw/openclaw.json.bak.$(date +%Y%m%d%H%M%S)"

echo "=== OpenClaw Gateway 配置更新 ==="
echo ""
echo "当前配置:"
grep -A5 "gateway" "$CONFIG_FILE" 2>/dev/null | head -10 || echo "未找到 gateway 配置"
echo ""

# Check if http.endpoints.chatCompletions already exists
if grep -q "chatCompletions" "$CONFIG_FILE"; then
  echo "✅ chatCompletions 端点已配置"
else
  echo "⚠️ chatCompletions 端点未配置，需要添加"
  echo ""
  
  # Backup
  cp "$CONFIG_FILE" "$BACKUP_FILE"
  echo "✅ 已备份配置文件到: $BACKUP_FILE"
  
  # Add the configuration
  # Using node to properly merge JSON
  node -e "
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('$CONFIG_FILE', 'utf-8'));

// Ensure gateway structure
config.gateway = config.gateway || {};
config.gateway.http = config.gateway.http || {};
config.gateway.http.endpoints = config.gateway.http.endpoints || {};
config.gateway.http.endpoints.chatCompletions = { enabled: true };

fs.writeFileSync('$CONFIG_FILE', JSON.stringify(config, null, 2));
console.log('✅ 已添加 chatCompletions 端点配置');
"

  echo ""
  echo "📝 配置已更新！需要重启 Gateway 才能生效。"
  echo ""
  echo "重启命令:"
  echo "  openclaw gateway restart"
  echo ""
fi

echo "=== 完成 ==="