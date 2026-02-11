#!/bin/bash
# free-token 停止脚本
# 停止 free-token 和 OpenCode 服务器

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== free-token 停止脚本 ==="

# 停止 free-token
PID=$(pgrep -f "node.*dist/index.js" 2>/dev/null || true)

if [ -n "$PID" ]; then
    echo "停止 free-token (PID: $PID)..."
    kill -TERM "$PID" 2>/dev/null || true
    
    for i in {1..10}; do
        if ! kill -0 "$PID" 2>/dev/null; then
            echo "✓ free-token 已停止"
            break
        fi
        sleep 1
    done
    
    # 强制杀死
    if kill -0 "$PID" 2>/dev/null; then
        echo "强制杀死 free-token 进程..."
        kill -9 "$PID" 2>/dev/null || true
    fi
else
    echo "free-token 未运行"
fi

# 停止 OpenCode 服务器
OPENCODE_PORT=${OPENCODE_PORT:-4096}
OPENCODE_PID=$(pgrep -f "opencode.*serve.*--port.*$OPENCODE_PORT" 2>/dev/null || true)

if [ -n "$OPENCODE_PID" ]; then
    echo "停止 OpenCode 服务器 (PID: $OPENCODE_PID)..."
    kill -TERM "$OPENCODE_PID" 2>/dev/null || true
    
    for i in {1..10}; do
        if ! kill -0 "$OPENCODE_PID" 2>/dev/null; then
            echo "✓ OpenCode 服务器已停止"
            break
        fi
        sleep 1
    done
    
    # 强制杀死
    if kill -0 "$OPENCODE_PID" 2>/dev/null; then
        echo "强制杀死 OpenCode 服务器进程..."
        kill -9 "$OPENCODE_PID" 2>/dev/null || true
    fi
else
    echo "OpenCode 服务器未运行"
fi

# 清理可能的僵尸进程
pkill -f "node.*dist/index.js" 2>/dev/null || true
pkill -f "opencode.*serve" 2>/dev/null || true

echo ""
echo "所有服务已停止"
