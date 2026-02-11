# free-token

让 OpenCode Zen Models 以 OpenAI 兼容接口的方式对外服务。

## 功能

- 免费调用 MiniMax、Kimichat、GLM 等模型
- 完全兼容 OpenAI `/v1/chat/completions` API
- 支持流式输出
- 自动维护对话上下文

## 原理

```
应用 → free-token (:3000) → OpenCode (:4096) → AI 模型
```

free-token 是 OpenAI 协议与 OpenCode HTTP Server 之间的桥梁。

## 安装

```bash
git clone https://github.com/LeeMeo/free-token.git
cd free-token && npm install
./scripts/start.sh
```

## 使用

任意支持 OpenAI API 的工具，配置 `baseUrl` 为 `http://localhost:3000/v1` 即可。

## 文档

详细文档、使用示例、模型列表：
https://github.com/LeeMeo/free-token
