import Fastify, { FastifyInstance } from 'fastify';
import { config } from '../config/config';
import { OpenCodeClient } from '../opencode/client';
import { ContextManager } from '../context/manager';
import { registerChatRoutes } from './routes/chat';
import { registerModelsRoutes } from './routes/models';

export async function createServer(opencodeClient: OpenCodeClient): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: true
  });

  const contextManager = new ContextManager(
    config.maxTokens,
    config.sessionTimeout,
    './sessions',
    config.disableContextPruning
  );

  setInterval(() => {
    contextManager.cleanupOldSessions();
  }, 60000);

  fastify.decorate('opencodeClient', opencodeClient);
  fastify.decorate('contextManager', contextManager);

  await registerModelsRoutes(fastify);
  await registerChatRoutes(fastify, opencodeClient, contextManager);

  fastify.get('/health', async () => ({ status: 'ok' }));

  return fastify;
}
