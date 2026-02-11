import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { OpenCodeClient } from '../../opencode/client';
import { ContextManager } from '../../context/manager';
import { mapToOpenAIChunk, createFinalChunk } from '../../streaming/mapper';
import { config } from '../../config/config';

interface ChatRequestBody {
  model?: string;
  messages: Array<{ role: string; content: string }>;
  stream?: boolean;
}

export async function registerChatRoutes(
  fastify: FastifyInstance,
  opencodeClient: OpenCodeClient,
  contextManager: ContextManager
): Promise<void> {
  fastify.post('/v1/chat/completions', async (
    request: FastifyRequest<{ Body: ChatRequestBody }>,
    reply: FastifyReply
  ) => {
    const { model: requestedModel, messages, stream = true } = request.body || {};

    console.log('[free-token] ===== POST /v1/chat/completions =====');
    console.log('[free-token] requestedModel:', requestedModel);
    console.log('[free-token] messages count:', messages?.length);
    console.log('[free-token] stream:', stream);
    console.log('[free-token] headers:', JSON.stringify(request.headers, null, 2));

    if (!messages || messages.length === 0) {
      return reply.status(400).send({ error: 'messages are required' });
    }

    let model = requestedModel || config.defaultModel;
    
    // 如果请求的是 'auto'，使用当前配置的默认模型
    if (model === 'auto') {
      model = config.defaultModel;
      console.log('[free-token] Mapped auto ->', model);
    }
    
    const sessionId = request.headers['x-session-id'] as string || 'default';
    let session = contextManager.getSession(sessionId);

    console.log('[free-token] using model:', model);
    console.log('[free-token] sessionId:', sessionId);

    if (!session) {
      session = contextManager.createSession(sessionId, process.cwd(),
        'You are OpenCode CLI, an AI-powered software engineering assistant.');
      console.log('[free-token] Created new session:', sessionId);
    }

    const instruction = messages[messages.length - 1].content;
    const history = contextManager.getHistory(sessionId);
    const tools = session.enabledTools.length > 0 ? session.enabledTools : config.defaultTools;
    const timeout = config.requestTimeout;

    const completionId = `cmpl-${Date.now()}`;

    if (stream) {
      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });

      const abortController = new AbortController();
      const timeoutHandle = setTimeout(() => abortController.abort(), timeout);

      const chunks: string[] = [];

      try {
        const generator = opencodeClient.execute({
          instruction,
          workspace: session.workspace,
          history,
          tools,
          timeout,
          signal: abortController.signal,
          model,
          sessionId: opencodeClient.getSessionId() || undefined
        });

        for await (const chunk of generator) {
          if (chunk.error) {
            const errorChunk = mapToOpenAIChunk({ content: chunk.error, done: true }, completionId, model);
            reply.raw.write(`data: ${JSON.stringify(errorChunk)}\n\n`);
            break;
          }

          chunks.push(chunk.content);

          if (chunk.content.length > 0) {
            const chars = chunk.content.split('');
            for (const char of chars) {
              const aiChunk = mapToOpenAIChunk({ content: char, done: false }, completionId, model);
              aiChunk.model = model;
              reply.raw.write(`data: ${JSON.stringify(aiChunk)}\n\n`);
            }
          }
        }

        const finalChunk = createFinalChunk(completionId, model);
        // 确保返回的响应中使用实际的模型名称
        finalChunk.model = model;
        reply.raw.write(`data: ${JSON.stringify(finalChunk)}\n\n`);
        reply.raw.end();

        const fullContent = chunks.join('');
        contextManager.addMessage(sessionId, 'user', instruction);
        contextManager.addMessage(sessionId, 'assistant', fullContent);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorChunk = mapToOpenAIChunk({ content: errorMessage, done: true }, completionId, model);
        reply.raw.write(`data: ${JSON.stringify(errorChunk)}\n\n`);
        reply.raw.end();
      } finally {
        clearTimeout(timeoutHandle);
      }

      return;
    }

    const chunks: string[] = [];

    const abortController = new AbortController();
    const timeoutHandle = setTimeout(() => abortController.abort(), timeout);

    try {
      const generator = opencodeClient.execute({
        instruction,
        workspace: session.workspace,
        history,
        tools,
        timeout,
        signal: abortController.signal,
        model,
        sessionId: opencodeClient.getSessionId() || undefined
      });

      for await (const chunk of generator) {
        if (chunk.error) {
          clearTimeout(timeoutHandle);
          return reply.status(500).send({
            error: chunk.error
          });
        }

        if (!chunk.done) {
          chunks.push(chunk.content);
        }
      }

      clearTimeout(timeoutHandle);

      const fullContent = chunks.join('');

      contextManager.addMessage(sessionId, 'user', instruction);
      contextManager.addMessage(sessionId, 'assistant', fullContent);

      return reply.status(200).send({
        id: completionId,
        object: 'chat.completion',
        created: Date.now(),
        model,
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: fullContent
            },
            finish_reason: 'stop'
          }
        ],
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
        }
      });

    } catch (error) {
      clearTimeout(timeoutHandle);
      return reply.status(500).send({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}
