#!/bin/bash
# FreeClaw 发布脚本
# 打包项目为可分发文件

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

VERSION=$(node -p "require('./package.json').version")
DATE=$(date +%Y%m%d)
PACKAGE_NAME="freeclaw-${VERSION}-${DATE}"
DIST_DIR="release/${PACKAGE_NAME}"

echo "=========================================="
echo "FreeClaw 发布打包工具 v${VERSION}"
echo "=========================================="

# 检查是否在 Git 仓库中
if [ -d ".git" ]; then
    COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    echo "Git Commit: ${COMMIT}"
fi

# 清理旧的发布文件
echo ""
echo "清理旧的发布文件..."
rm -rf release/
mkdir -p "${DIST_DIR}"

# 构建项目
echo ""
echo "构建项目..."
npm run clean
npm run build

# 复制必要文件
echo ""
echo "复制文件..."

# 复制 package.json
cp package.json "${DIST_DIR}/"

# 复制编译后的代码
cp -r dist "${DIST_DIR}/"

# 复制配置
cp .env.production "${DIST_DIR}/.env.example"
cp .env.production "${DIST_DIR}/.env"

# 复制脚本
mkdir -p "${DIST_DIR}/scripts"
cp scripts/*.sh "${DIST_DIR}/scripts/" 2>/dev/null || true
cp scripts/*.bat "${DIST_DIR}/scripts/" 2>/dev/null || true

# 复制文档
mkdir -p "${DIST_DIR}/docs"
cp -r docs/* "${DIST_DIR}/docs/"
cp README.md "${DIST_DIR}/"

# 创建安装脚本
cat > "${DIST_DIR}/INSTALL.sh" << 'INSTALL_EOF'
#!/bin/bash
# FreeClaw 安装脚本

set -e

echo "安装 FreeClaw..."

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
INSTALL_EOF

chmod +x "${DIST_DIR}/INSTALL.sh"

# 创建 tar.gz 包
echo ""
echo "创建压缩包..."
cd release
tar -czf "../${PACKAGE_NAME}.tar.gz" "${PACKAGE_NAME}"
cd ..

# 创建 SHA256 校验和
echo ""
echo "生成校验和..."
sha256sum "${PACKAGE_NAME}.tar.gz" > "${PACKAGE_NAME}.tar.gz.sha256"

# 清理目录
rm -rf "${DIST_DIR}"

echo ""
echo "=========================================="
echo "打包完成！"
echo "=========================================="
echo ""
echo "文件: ${PACKAGE_NAME}.tar.gz"
echo "大小: $(du -h "${PACKAGE_NAME}.tar.gz" | cut -f1)"
echo "校验和: ${PACKAGE_NAME}.tar.gz.sha256"
echo ""
echo "发布命令:"
echo "  scp ${PACKAGE_NAME}.tar.gz user@server:/path/to/deploy/"
echo ""
echo "在服务器上解压并运行:"
echo "  tar -xzf ${PACKAGE_NAME}.tar.gz"
echo "  cd ${PACKAGE_NAME}"
echo "  ./INSTALL.sh"
echo "  npm start"
echo ""
