# FreeClaw 设计文档：OpenAI 兼容的 LLM Provider

## 概述

FreeClaw 是一个 OpenAI 兼容的 LLM Provider，通过封装 OpenCode CLI 实现。它为其他应用提供标准的 OpenAI 格式 API，内部通过子进程与 OpenCode CLI 通信，暴露 OpenCode 的全部能力。

## 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                         FreeClaw                             │
│              (OpenAI 兼容的 LLM Provider)                     │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  OpenAI 兼容 API 服务器 (Node.js + Fastify)         │   │
│  │  - POST /v1/chat/completions                          │   │
│  │  - POST /v1/models                                    │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  OpenCode CLI 适配层                                   │   │
│  │  - 请求翻译器 (OpenAI → OpenCode 命令)                │   │
│  │  - 响应转换器 (OpenCode 输出 → OpenAI 格式)            │   │
│  │  - 上下文管理器 (对话历史、项目状态)                    │   │
│  │  - 流式处理器 (SSE 实时推送)                           │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  OpenCode CLI 子进程                                   │   │
│  │  (通过 stdin/stdout + JSON-RPC 通信)                  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## API 端点设计

### POST /v1/chat/completions

**请求格式：**

```json
{
  "model": "opencode-cli",
  "messages": [
    { "role": "system", "content": "You are OpenCode CLI..." },
    { "role": "user", "content": "Read src/app.py and add error handling" }
  ],
  "stream": true,
  "max_tokens": 4096,
  "temperature": 0.7
}
```

**流式响应格式（SSE）：**

```
data: {"id":"1","object":"chat.completion.chunk","created":1,"model":"opencode-cli","choices":[{"index":0,"delta":{"content":"Reading"},"finish_reason":null}]}

data: {"id":"1","object":"chat.completion.chunk","created":1,"model":"opencode-cli","choices":[{"index":0,"delta":{"content":" src/app.py..."},"finish_reason":null}]}

data: {"id":"1","object":"chat.completion.chunk","created":1,"model":"opencode-cli","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}
```

## OpenCode CLI 通信协议

### 通信方式

使用 JSON-RPC 2.0 协议，通过子进程的 stdin/stdout 进行通信。

**请求格式：**

```json
{
  "jsonrpc": "2.0",
  "id": "conv-123",
  "method": "execute",
  "params": {
    "instruction": "Read src/app.py and add error handling",
    "context": {
      "workspace": "D:\\AI\\workspace\\FreeClaw",
      "history": [
        { "role": "user", "content": "Create a new API endpoint" },
        { "role": "assistant", "content": "Done. Created src/api.py" }
      ]
    },
    "options": {
      "tools": ["read", "write", "bash"],
      "timeout": 120,
      "stream": true
    }
  }
}
```

**响应格式（流式输出）：**

```json
{"jsonrpc":"2.0","id":"conv-123","params":{"type":"stdout","content":"Reading"}}
{"jsonrpc":"2.0","id":"conv-123","params":{"type":"stdout","content":" src/app.py..."}}
{"jsonrpc":"2.0","id":"conv-123","params":{"type":"done","result":{"success":true}}}
```

**错误格式：**

```json
{
  "jsonrpc": "2.0",
  "id": "conv-123",
  "error": {
    "code": -32000,
    "message": "OpenCode CLI execution failed",
    "data": "Timeout after 120s"
  }
}
```

## 上下文管理

### 上下文数据结构

```typescript
interface SessionContext {
  session_id: string;
  workspace: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  enabled_tools: string[];
  created_at: Date;
  last_active: Date;
}
```

### 对话历史压缩策略

当 token 超过限制时，保留 system 消息，压缩或删除早期的用户/助手消息对：

```
原始对话:
[System] You are OpenCode...
[User] Create login API → [Assistant] Done
[User] Add logout → [Assistant] Done
[User] Add profile page → [Assistant] Done
[User] Add error handling to app.py

压缩后:
[System] You are OpenCode...
[History] Created login/logout APIs and profile page
[Current] Add error handling to app.py
```

## 技术选型

| 组件 | 选择 | 理由 |
|------|------|------|
| 运行时 | Node.js 20+ | SSE 原生支持，生态成熟 |
| 框架 | Fastify | 高性能，适合 SSE |
| 类型 | TypeScript | 类型安全 |
| 通信 | child_process | Node.js 原生子进程支持 |
| 包管理 | pnpm | 快速，依赖管理简洁 |

## 项目结构

```
freeclaw/
├── src/
│   ├── index.ts              # 入口文件
│   ├── server/
│   │   ├── server.ts         # Fastify 服务器
│   │   ├── routes/
│   │   │   ├── chat.ts       # /v1/chat/completions
│   │   │   └── models.ts      # /v1/models
│   │   └── middleware/
│   │       └── logger.ts
│   ├── opencode/
│   │   ├── client.ts         # OpenCode 子进程客户端
│   │   ├── protocol.ts       # JSON-RPC 协议定义
│   │   └── types.ts
│   ├── context/
│   │   ├── manager.ts        # 对话上下文管理
│   │   └── history.ts
│   ├── streaming/
│   │   ├── sse.ts            # SSE 工具函数
│   │   └── mapper.ts         # OpenCode 输出 → OpenAI 格式
│   └── config/
│       └── config.ts
├── package.json
├── tsconfig.json
├── README.md
└── docs/
    └── plans/
        └── 2026-02-04-opencode-llm-provider-design.md
```

## 部署方式

### 开发模式

```bash
npm run dev
```

### 生产模式

```bash
npm run build
node dist/index.js
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

## 下一步

1. 初始化项目：`npm init`
2. 安装依赖：`npm install fastify typescript ts-node`
3. 实现核心模块
4. 测试 OpenCode CLI 集成
