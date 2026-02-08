import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { DEFAULT_MODELS, getDefaultModel, setDefaultModel } from '../../opencode/protocol';

export async function registerModelsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/v1/models', async (request: FastifyRequest, reply) => {
    return {
      object: 'list',
      data: DEFAULT_MODELS.map(model => ({
        id: model.id,
        object: 'model',
        created: Date.now(),
        owned_by: model.provider,
        name: model.name,
        provider: model.provider
      }))
    };
  });

  fastify.get('/v1/models/default', async (request: FastifyRequest, reply: FastifyReply) => {
    const current = getDefaultModel();
    const model = DEFAULT_MODELS.find(m => m.id === current);
    return {
      object: 'model',
      id: current,
      name: model?.name || current
    };
  });

  fastify.post('/v1/models/default', async (request: FastifyRequest<{ Body: { model: string } }>, reply: FastifyReply) => {
    const { model } = request.body || {};
    if (!model) {
      return reply.status(400).send({ error: 'model is required' });
    }
    const success = setDefaultModel(model);
    if (success) {
      return { success: true, current: getDefaultModel() };
    }
    return reply.status(400).send({ error: 'model not found', available: DEFAULT_MODELS.map(m => m.id) });
  });
}
