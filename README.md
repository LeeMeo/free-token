# 🚀 Free-Token

**免费大模型 API 网关 - 零成本使用顶级 AI 模型**

[![][stars]][![][license]]

[![][features-ai]][![][features-streaming]][![][features-free]][![][features-local]]

---

## ✨ 为什么选择 Free-Token？

**你不需要花一分钱，就能使用顶级大模型！**

| 对比项 | 🔴 其他 API | 🟢 Free-Token |
|--------|------------|---------------|
| 成本 | $10+/月 | **完全免费** |
| 额度 | 有限制 | **无限使用** |
| 速度 | 受限 | **高速响应** |
| 隐私 | 数据外泄 | **本地部署** |

---

## 🎯 一句话总结

> Free-Token = **免费** + **无限额度** + **本地部署** + **OpenAI 兼容**

**不需要 API Key，不需要信用卡，不需要付费 - 开箱即用！**

---

## 🏗️ 架构

```
┌─────────────────────────────────────────────────────────────┐
│                        Free-Token                              │
│         🌐 OpenAI 兼容 API 网关 (:3000)                       │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   OpenCode HTTP Server                          │
│                   🔑 自动认证 • 📊 会话管理                    │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    🌟 免费大模型                                │
│   ┌──────────────┬──────────────┬──────────────┐          │
│   │ MiniMax M2.1 │  Big Pickle  │ GPT-5 Nano  │          │
│   └──────────────┴──────────────┴──────────────┘          │
│         ✨              🆓              ⚡                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎁 免费模型

| 模型 | 能力 | 适合场景 |
|------|------|---------|
| **MiniMax M2.1** | 🌟 顶级推理 | 代码/数学/分析 |
| **Big Pickle** | 🐙 通用对话 | 日常问答 |
| **GPT-5 Nano** | ⚡ 轻量快速 | 简单任务 |
| **GLM-4.7** | 🔬 科研辅助 | 长文本 |
| **Kimi K2.5** | 📚 长文档 | 阅读理解 |

---

## 🚀 快速开始

```bash
# 克隆并安装
git clone https://github.com/yourname/free-token.git
cd free-token
npm install

# 启动服务
./scripts/start.sh

# 开始使用！
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "minimax-m2.1-free", "messages": [{"role": "user", "content": "你好！"}]}'
```

---

## 💡 使用示例

### Continue.dev

```json
{
  "models": [{
    "title": "Free-Token",
    "provider": "openai",
    "model": "minimax-m2.1-free",
    "apiKey": "any-string",
    "baseUrl": "http://localhost:3000/v1"
  }]
}
```

### Claude Code

```bash
export OPENAI_API_KEY="any-string"
export OPENAI_BASE_URL="http://localhost:3000/v1"
```

### 编程调用

```javascript
const response = await fetch('http://localhost:3000/v1/chat/completions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'minimax-m2.1-free',
    messages: [{ role: 'user', content: 'Hello!' }]
  })
});

for await (const chunk of response.body) {
  console.log(chunk);
}
```

---

## 🛠️ 模型切换

```bash
# 查看当前模型
curl http://localhost:3000/v1/models/default

# 切换模型（无需重启）
curl -X POST http://localhost:3000/v1/models/default \
  -H "Authorization: Bearer freeclaw_secret_token_2026" \
  -d '{"model": "minimax-m2.1-free"}'
```

---

## 📊 对比其他方案

| 方案 | 月成本 | 额度 | 速度 | 隐私 |
|------|--------|------|------|------|
| **Free-Token** | **$0** | ∞ | 快 | ✅ 本地 |
| OpenAI API | $10+ | 有限 | 快 | ❌ 云端 |
| Anthropic | $20+ | 有限 | 快 | ❌ 云端 |
| Claude Pro | $20 | 有限 | 快 | ❌ 云端 |

---

## 🎮 支持的应用

- ✅ Continue.dev (VS Code)
- ✅ Claude Code
- ✅ Cline (VS Code)
- ✅ OpenWebUI
- ✅ Anything LLM
- ✅ Cherry Studio
- ✅ 任意 OpenAI 兼容客户端

---

## 📦 部署

### Linux/macOS (PM2)

```bash
npm install -g pm2
pm2 start dist/index.js --name free-token
pm2 save
pm2 startup
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY dist ./dist
COPY package.json .
RUN npm ci --only=production
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

---

## 🔧 配置

| 环境变量 | 默认值 | 说明 |
|---------|--------|------|
| `PORT` | `3000` | 服务端口 |
| `OPENCODE_SERVER_HOST` | `127.0.0.1` | OpenCode 地址 |
| `OPENCODE_SERVER_PORT` | `4096` | OpenCode 端口 |
| `DEFAULT_MODEL` | `big-pickle` | 默认模型 |

---

## 🎯 适用人群

| 群体 | 收益 |
|------|------|
| 🧑‍💻 开发者 | 免费测试、无限额度 |
| 🧑‍🎓 学生 | 零成本学习 AI |
| 🧑‍🔬 研究员 | 大规模实验 |
| 🏢 企业 | 降低 AI 成本 |
| 🤖 AI 爱好者 | 探索不同模型 |

---

## 📈 路线图

- [ ] 多提供商支持（DeepSeek、Ollama）
- [ ] Token 统计 Dashboard
- [ ] Docker 一键部署
- [ ] 模型负载均衡
- [ ] 缓存加速

---

## 🤝 贡献

欢迎提交 PR！

---

## 📄 许可证

MIT License

---

## ☕ 赞助

如果对你有帮助，欢迎 Star ⭐ 支持！

---

**[English README](./README_EN.md)**

---

**🚀 开始你的免费 AI 之旅！**
