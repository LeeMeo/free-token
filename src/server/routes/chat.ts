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

    console.log('[FreeClaw] ===== POST /v1/chat/completions =====');
    console.log('[FreeClaw] requestedModel:', requestedModel);
    console.log('[FreeClaw] messages count:', messages?.length);
    console.log('[FreeClaw] stream:', stream);
    console.log('[FreeClaw] headers:', JSON.stringify(request.headers, null, 2));

    if (!messages || messages.length === 0) {
      return reply.status(400).send({ error: 'messages are required' });
    }

    const model = requestedModel || config.defaultModel;
    const sessionId = request.headers['x-session-id'] as string || 'default';
    let session = contextManager.getSession(sessionId);

    console.log('[FreeClaw] using model:', model);
    console.log('[FreeClaw] sessionId:', sessionId);

    if (!session) {
      session = contextManager.createSession(sessionId, process.cwd(),
        'You are OpenCode CLI, an AI-powered software engineering assistant.');
      console.log('[FreeClaw] Created new session:', sessionId);
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

      try {
        const generator = opencodeClient.execute(
          instruction,
          session.workspace,
          history,
          tools,
          timeout,
          abortController.signal,
          model
        );

        for await (const chunk of generator) {
          if (chunk.error) {
            const errorChunk = mapToOpenAIChunk({ content: chunk.error, done: true }, completionId, model);
            reply.raw.write(`data: ${JSON.stringify(errorChunk)}\n\n`);
            break;
          }

          const aiChunk = mapToOpenAIChunk(chunk, completionId, model);
          reply.raw.write(`data: ${JSON.stringify(aiChunk)}\n\n`);
        }

        const finalChunk = createFinalChunk(completionId, model);
        reply.raw.write(`data: ${JSON.stringify(finalChunk)}\n\n`);
        reply.raw.end();

        contextManager.addMessage(sessionId, 'user', instruction);
        contextManager.addMessage(sessionId, 'assistant', instruction);

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
      const generator = opencodeClient.execute(
        instruction,
        session.workspace,
        history,
        tools,
        timeout,
        abortController.signal,
        model
      );

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
