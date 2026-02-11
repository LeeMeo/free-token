#!/bin/bash
# free-token 安装脚本

set -e

echo "安装 free-token..."

# 检查 Node.js 版本
NODE_VERSION=$(node -v 2>/dev/null | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"

if [ -z "$NODE_VERSION" ]; then
    echo "错误: 未找到 Node.js，请先安装 Node.js >= 18"
    exit 1
fi

echo "Node.js 版本: ${NODE_VERSION}"

# 安装依赖
echo "安装依赖..."
npm install --prefer-offline --no-audit --only=production

# 复制环境配置文件
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "已创建 .env 文件，请根据实际情况修改"
fi

echo ""
echo "安装完成！"
echo ""
echo "启动服务:"
echo "  npm start"
echo ""
echo "或使用 PM2:"
echo "  npm install -g pm2"
echo "  pm2 start dist/index.js --name freeclaw"
echo "  pm2 save"
