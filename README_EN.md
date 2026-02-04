# 🚀 Free-Token

**Free AI Model API Gateway - Use Top AI Models at Zero Cost**

**Works with OpenClaw, Feishu, Cline, and more**

[English](./README_EN.md) | [中文](./README.md)

**You don't need to spend a dime to use top-tier AI models!**

| Comparison | 🔴 Other APIs | 🟢 Free-Token |
|------------|--------------|---------------|
| Cost | $10+/month | **Completely Free** |
| Quotas | Limited | **Unlimited** |
| Speed | Throttled | **High Speed** |
| Privacy | Data leaks | **Local Deployment** |

---

## 🎯 One-Line Summary

> Free-Token = **Free** + **Unlimited** + **Local Deployment** + **OpenAI Compatible**

**No API keys, no credit cards, no payments - ready to use out of the box!**

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Free-Token                              │
│         🌐 OpenAI Compatible API Gateway (:3000)              │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   OpenCode HTTP Server                          │
│                   🔑 Auto Auth • 📊 Session Management         │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    🌟 Free AI Models                           │
│   ┌──────────────┬──────────────┬──────────────┐          │
│   │ MiniMax M2.1 │  Big Pickle  │ GPT-5 Nano  │          │
│   └──────────────┴──────────────┴──────────────┘          │
│         ✨              🆓              ⚡                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎁 Free Models

| Model | Capability | Best For |
|-------|-----------|----------|
| **MiniMax M2.1** | 🌟 Top Reasoning | Code/Math/Analysis |
| **Big Pickle** | 🐙 General Chat | Q&A |
| **GPT-5 Nano** | ⚡ Lightweight | Simple Tasks |
| **GLM-4.7** | 🔬 Research | Long Text |
| **Kimi K2.5** | 📚 Documents | Reading |

---

## 🚀 Quick Start

```bash
# Clone and install
git clone https://github.com/yourname/free-token.git
cd free-token
npm install

# Start service
./scripts/start.sh

# Start using!
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "minimax-m2.1-free", "messages": [{"role": "user", "content": "Hello!"}]}'
```

---

## 💡 Usage Examples

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

### Programming

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

## 🛠️ Model Switching

```bash
# View current model
curl http://localhost:3000/v1/models/default

# Switch model (no restart needed)
curl -X POST http://localhost:3000/v1/models/default \
  -H "Authorization: Bearer freeclaw_secret_token_2026" \
  -d '{"model": "minimax-m2.1-free"}'
```

---

## 📊 Compare with Alternatives

| Solution | Monthly Cost | Quotas | Speed | Privacy |
|----------|--------------|--------|-------|----------|
| **Free-Token** | **$0** | ∞ | Fast | ✅ Local |
| OpenAI API | $10+ | Limited | Fast | ❌ Cloud |
| Anthropic | $20+ | Limited | Fast | ❌ Cloud |
| Claude Pro | $20 | Limited | Fast | ❌ Cloud |

---

## 🎮 Supported Applications

- ✅ Continue.dev (VS Code)
- ✅ Claude Code
- ✅ Cline (VS Code)
- ✅ OpenWebUI
- ✅ Anything LLM
- ✅ Cherry Studio
- ✅ Any OpenAI Compatible Client

---

## 📦 Deployment

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

## 🔧 Configuration

| Environment Var | Default | Description |
|----------------|---------|-------------|
| `PORT` | `3000` | Service port |
| `OPENCODE_SERVER_HOST` | `127.0.0.1` | OpenCode address |
| `OPENCODE_SERVER_PORT` | `4096` | OpenCode port |
| `DEFAULT_MODEL` | `big-pickle` | Default model |

---

## 🎯 Target Audience

| Group | Benefit |
|-------|---------|
| 🧑‍💻 Developers | Free testing, unlimited quotas |
| 🧑‍🎓 Students | Zero-cost AI learning |
| 🧑‍🔬 Researchers | Large-scale experiments |
| 🏢 Enterprises | Reduce AI costs |
| 🤖 AI Enthusiasts | Explore different models |

---

## 📈 Roadmap

- [ ] Multi-provider support (DeepSeek, Ollama)
- [ ] Token statistics Dashboard
- [ ] Docker one-click deployment
- [ ] Model load balancing
- [ ] Caching acceleration

---

## 🤝 Contributing

PRs welcome!

---

## 📄 License

MIT License

---

## ☕ Sponsorship

If this project helps you, please Star ⭐ to show support!

---

**[中文 README](./README.md)**

---

**🚀 Start your free AI journey today!**
