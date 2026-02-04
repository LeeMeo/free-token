"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerModelsRoutes = registerModelsRoutes;
const protocol_1 = require("../../opencode/protocol");
async function registerModelsRoutes(fastify) {
    fastify.get('/v1/models', async (request, reply) => {
        return {
            object: 'list',
            data: protocol_1.DEFAULT_MODELS.map(model => ({
                id: model.id,
                object: 'model',
                created: Date.now(),
                owned_by: model.provider,
                name: model.name,
                provider: model.provider
            }))
        };
    });
    fastify.get('/v1/models/default', async (request, reply) => {
        const current = (0, protocol_1.getDefaultModel)();
        const model = protocol_1.DEFAULT_MODELS.find(m => m.id === current);
        return {
            object: 'model',
            id: current,
            name: model?.name || current
        };
    });
    fastify.post('/v1/models/default', async (request, reply) => {
        const { model } = request.body || {};
        if (!model) {
            return reply.status(400).send({ error: 'model is required' });
        }
        const success = (0, protocol_1.setDefaultModel)(model);
        if (success) {
            return { success: true, current: (0, protocol_1.getDefaultModel)() };
        }
        return reply.status(400).send({ error: 'model not found', available: protocol_1.DEFAULT_MODELS.map(m => m.id) });
    });
}
//# sourceMappingURL=models.js.map