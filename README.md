# FreeClaw

OpenAI 兼容的 LLM API 网关，通过连接 OpenCode HTTP Server 提供 OpenAI 格式的 API。

## 架构

```
┌─────────────────────────────────────────┐
│              FreeClaw                    │
│   (OpenAI 兼容 API 网关 :3000)           │
└──────────────┬──────────────────────────┘
               │ HTTP
               ▼
┌─────────────────────────────────────────┐
│         OpenCode HTTP Server             │
│          (内置服务器 :4096)              │
│    自动管理认证和会话状态                 │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│        OpenCode Zen Models              │
│   big-pickle, kimi-k2.5, minimax...     │
└─────────────────────────────────────────┘
```

## 功能特性

- ✅ OpenAI 兼容 API (`/v1/chat/completions`, `/v1/models`)
- ✅ 支持流式 (streaming) 和非流式响应
- ✅ 自动管理 OpenCode HTTP Server 生命周期
- ✅ 自动处理认证
- ✅ 跨平台支持 (Windows/Linux/macOS)

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动服务

```bash
# 使用启动脚本（自动管理 OpenCode Server）
./scripts/start.sh

# 或手动启动
npm run build
npm start
```

### 3. 测试

```bash
# 健康检查
curl http://localhost:3000/health

# 列出可用模型
curl http://localhost:3000/v1/models

# 发送消息（非流式）
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"big-pickle","messages":[{"role":"user","content":"Hello!"}],"stream":false}'

# 发送消息（流式）
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"big-pickle","messages":[{"role":"user","content":"Hello!"}],"stream":true}'
```

## API 端点

### Chat Completions

```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "big-pickle",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ],
    "stream": true
  }'
```

**请求参数:**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `model` | string | 否 | 模型 ID，默认 `big-pickle` |
| `messages` | array | 是 | 消息数组 |
| `stream` | boolean | 否 | 是否开启流式，默认 `false` |

**消息格式:**

```json
{
  "messages": [
    {"role": "user", "content": "你的问题"}
  ]
}
```

### List Models

```bash
curl http://localhost:3000/v1/models
```

**响应格式:**

```json
{
  "object": "list",
  "data": [
    {
      "id": "big-pickle",
      "object": "model",
      "created": 1234567890,
      "owned_by": "opencode",
      "name": "Big Pickle",
      "provider": "opencode"
    }
  ]
}
```

### Health Check

```bash
curl http://localhost:3000/health
```

**响应:**

```json
{"status":"ok"}
```

## 可用模型

| 模型 ID | 名称 | 说明 |
|---------|------|------|
| `big-pickle` | Big Pickle | OpenCode 默认模型 |
| `trinity-large-preview-free` | Trinity Large Preview | 最新预览模型 |
| `gpt-5-nano` | GPT-5 Nano | 轻量级 GPT-5 |
| `glm-4.7-free` | GLM-4.7 Free | 智谱 AI 免费模型 |
| `minimax-m2.1-free` | MiniMax M2.1 Free | MiniMax 免费模型 |
| `kimi-k2.5-free` | Kimi K2.5 Free | 月之暗面免费模型 |

## 在其他应用中使用

### Continue.dev

在 `~/.continue/config.json` 中添加:

```json
{
  "models": [
    {
      "title": "FreeClaw",
      "provider": "openai",
      "model": "big-pickle",
      "apiKey": "any-string",
      "baseUrl": "http://localhost:3000/v1"
    }
  ]
}
```

### Claude Code

```bash
export OPENAI_API_KEY="any-string"
export OPENAI_BASE_URL="http://localhost:3000/v1"
```

### Cline

在设置中添加:

```
API Provider: OpenAI
Base URL: http://localhost:3000/v1
API Key: any-string
Model: big-pickle
```

### 编程调用

```javascript
const response = await fetch('http://localhost:3000/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'big-pickle',
    messages: [
      { role: 'user', content: 'Hello!' }
    ],
    stream: true
  })
});

for await (const chunk of response.body) {
  console.log(chunk);
}
```

## 配置

### 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `3000` | FreeClaw 服务端口 |
| `OPENCODE_SERVER_HOST` | `127.0.0.1` | OpenCode HTTP Server 地址 |
| `OPENCODE_SERVER_PORT` | `4096` | OpenCode HTTP Server 端口 |
| `OPENCODE_SERVER_USERNAME` | `opencode` | 认证用户名 |
| `OPENCODE_SERVER_PASSWORD` | (自动获取) | 认证密码 |
| `DEFAULT_MODEL` | `big-pickle` | 默认模型 |
| `REQUEST_TIMEOUT` | `300000` | 请求超时 (毫秒) |

### 使用启动脚本

启动脚本会自动:

1. 启动 OpenCode HTTP Server (如果未运行)
2. 等待 OpenCode Server 就绪
3. 启动 FreeClaw
4. 显示 API 端点信息

```bash
# Linux/macOS
./scripts/start.sh
./scripts/stop.sh

# Windows
scripts\start.bat
scripts\stop.bat
```

### 手动管理

```bash
# 启动 OpenCode Server
opencode serve --port 4096 --hostname 127.0.0.1

# 启动 FreeClaw
npm start

# 或指定端口
PORT=3000 npm start
```

## 开发

```bash
# 安装依赖
npm install

# 开发模式（热重载）
npm run dev

# 构建
npm run build

# 运行测试
npm test
```

## 部署

### Linux/macOS

```bash
# 使用 PM2
npm install -g pm2
pm2 start dist/index.js --name freeclaw
pm2 save
pm2 startup
```

### Systemd (Linux)

创建 `/etc/systemd/system/freeclaw.service`:

```ini
[Unit]
Description=FreeClaw LLM Provider
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/freeclaw
ExecStart=/usr/bin/node /path/to/freeclaw/dist/index.js
Restart=always
RestartSec=10
Environment=PORT=3000
Environment=OPENCODE_SERVER_PORT=4096

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable freeclaw
sudo systemctl start freeclaw
```

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY dist ./dist
COPY package.json ./
RUN npm ci --only=production

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

## 故障排查

### 服务无法启动

```bash
# 检查端口占用
ss -tlnp | grep 3000

# 查看日志
tail -f logs/freeclaw.log
```

### OpenCode Server 问题

```bash
# 检查 OpenCode 是否安装
which opencode

# 测试 OpenCode Server
curl http://127.0.0.1:4096/global/health
```

### 模型调用失败

```bash
# 验证模型列表
curl http://localhost:3000/v1/models

# 测试具体模型
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"big-pickle","messages":[{"role":"user","content":"test"}]}'
```

## 目录结构

```
freeclaw/
├── src/              # TypeScript 源代码
├── dist/             # 编译后的 JavaScript
├── scripts/          # 启动/停止脚本
├── docs/             # 文档
├── logs/             # 日志文件
├── .env.example      # 环境变量示例
└── package.json
```

## 许可证

MIT
