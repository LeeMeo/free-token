"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServer = createServer;
const fastify_1 = __importDefault(require("fastify"));
const config_1 = require("../config/config");
const manager_1 = require("../context/manager");
const chat_1 = require("./routes/chat");
const models_1 = require("./routes/models");
async function createServer(opencodeClient) {
    const fastify = (0, fastify_1.default)({
        logger: true
    });
    const contextManager = new manager_1.ContextManager(config_1.config.maxTokens);
    fastify.decorate('opencodeClient', opencodeClient);
    fastify.decorate('contextManager', contextManager);
    await (0, models_1.registerModelsRoutes)(fastify);
    await (0, chat_1.registerChatRoutes)(fastify, opencodeClient, contextManager);
    fastify.get('/health', async () => ({ status: 'ok' }));
    return fastify;
}
//# sourceMappingURL=server.js.map