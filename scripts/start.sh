#!/bin/bash
# free-token 启动脚本
# 自动启动 OpenCode 服务器和 free-token

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 加载环境变量
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# 设置默认值
OPENCODE_PORT=${OPENCODE_PORT:-4096}
FREECLAW_PORT=${PORT:-3000}

# 确保使用正确的密码
if [ -z "$OPENCODE_SERVER_PASSWORD" ]; then
    echo "使用默认密码..."
    export OPENCODE_SERVER_PASSWORD="free-token_secret_token_2026"
else
    echo "使用.env中配置的密码..."
fi

echo "=== free-token 启动脚本 ==="
echo "OpenCode 端口: $OPENCODE_PORT"
echo "free-token 端口: $FREECLAW_PORT"
echo "OpenCode 密码: $OPENCODE_SERVER_PASSWORD"

# 检查 OpenCode 是否已运行
OPENCODE_PID=$(pgrep -f "opencode.*serve.*--port.*$OPENCODE_PORT" 2>/dev/null || true)
if [ -n "$OPENCODE_PID" ]; then
    echo "OpenCode 服务器已在运行 (PID: $OPENCODE_PID)"
else
    echo "启动 OpenCode 服务器..."

    # 启动 OpenCode 服务器
    nohup opencode serve --port "$OPENCODE_PORT" --hostname 127.0.0.1 >> ../logs/opencode.log 2>&1 &
    OPENCODE_PID=$!
    echo "OpenCode 服务器已启动 (PID: $OPENCODE_PID)"

    # 等待 OpenCode 服务器就绪
    echo "等待 OpenCode 服务器就绪..."
    for i in {1..10}; do
        if curl -s -u "opencode:$OPENCODE_SERVER_PASSWORD" "http://127.0.0.1:$OPENCODE_PORT/global/health" > /dev/null 2>&1; then
            echo "OpenCode 服务器已就绪"
            break
        fi
        sleep 1
    done
fi

# 检查是否已在运行
PID=$(pgrep -f "node.*dist/index.js" 2>/dev/null || true)
if [ -n "$PID" ]; then
    echo "free-token 已在运行 (PID: $PID)"
    exit 0
fi

echo "启动 free-token..."

# 编译（如果需要）
if [ "$1" == "--build" ]; then
    echo "编译项目..."
    npm run build
fi

# 启动服务
nohup node ../dist/index.js >> ../logs/free-token.log 2>&1 &
PID=$!

echo "free-token 已启动 (PID: $PID)"

# 等待服务就绪
for i in {1..10}; do
    if curl -s "http://localhost:${FREECLAW_PORT}/health" > /dev/null 2>&1; then
        echo "✓ free-token 服务已就绪 (http://localhost:$FREECLAW_PORT)"
        echo "✓ 可用模型列表: http://localhost:$FREECLAW_PORT/v1/models"
        echo ""
        echo "API 端点:"
        echo "  - Chat Completions: POST http://localhost:$FREECLAW_PORT/v1/chat/completions"
        echo "  - List Models: GET http://localhost:$FREECLAW_PORT/v1/models"
        exit 0
    fi
    sleep 1
done

echo "警告: 服务可能未完全就绪，请检查 logs/free-token.log"
