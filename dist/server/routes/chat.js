"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerChatRoutes = registerChatRoutes;
const mapper_1 = require("../../streaming/mapper");
const config_1 = require("../../config/config");
async function registerChatRoutes(fastify, opencodeClient, contextManager) {
    fastify.post('/v1/chat/completions', async (request, reply) => {
        const { model: requestedModel, messages, stream = true } = request.body || {};
        console.log('[FreeClaw] ===== POST /v1/chat/completions =====');
        console.log('[FreeClaw] requestedModel:', requestedModel);
        console.log('[FreeClaw] messages count:', messages?.length);
        console.log('[FreeClaw] stream:', stream);
        console.log('[FreeClaw] headers:', JSON.stringify(request.headers, null, 2));
        if (!messages || messages.length === 0) {
            return reply.status(400).send({ error: 'messages are required' });
        }
        const model = requestedModel || config_1.config.defaultModel;
        const sessionId = request.headers['x-session-id'] || 'default';
        let session = contextManager.getSession(sessionId);
        console.log('[FreeClaw] using model:', model);
        console.log('[FreeClaw] sessionId:', sessionId);
        if (!session) {
            session = contextManager.createSession(sessionId, process.cwd(), 'You are OpenCode CLI, an AI-powered software engineering assistant.');
            console.log('[FreeClaw] Created new session:', sessionId);
        }
        const instruction = messages[messages.length - 1].content;
        const history = contextManager.getHistory(sessionId);
        const tools = session.enabledTools.length > 0 ? session.enabledTools : config_1.config.defaultTools;
        const timeout = config_1.config.requestTimeout;
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
                const generator = opencodeClient.execute(instruction, session.workspace, history, tools, timeout, abortController.signal, model);
                for await (const chunk of generator) {
                    if (chunk.error) {
                        const errorChunk = (0, mapper_1.mapToOpenAIChunk)({ content: chunk.error, done: true }, completionId, model);
                        reply.raw.write(`data: ${JSON.stringify(errorChunk)}\n\n`);
                        break;
                    }
                    const aiChunk = (0, mapper_1.mapToOpenAIChunk)(chunk, completionId, model);
                    reply.raw.write(`data: ${JSON.stringify(aiChunk)}\n\n`);
                }
                const finalChunk = (0, mapper_1.createFinalChunk)(completionId, model);
                reply.raw.write(`data: ${JSON.stringify(finalChunk)}\n\n`);
                reply.raw.end();
                contextManager.addMessage(sessionId, 'user', instruction);
                contextManager.addMessage(sessionId, 'assistant', instruction);
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                const errorChunk = (0, mapper_1.mapToOpenAIChunk)({ content: errorMessage, done: true }, completionId, model);
                reply.raw.write(`data: ${JSON.stringify(errorChunk)}\n\n`);
                reply.raw.end();
            }
            finally {
                clearTimeout(timeoutHandle);
            }
            return;
        }
        const chunks = [];
        const abortController = new AbortController();
        const timeoutHandle = setTimeout(() => abortController.abort(), timeout);
        try {
            const generator = opencodeClient.execute(instruction, session.workspace, history, tools, timeout, abortController.signal, model);
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
        }
        catch (error) {
            clearTimeout(timeoutHandle);
            return reply.status(500).send({
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
}
//# sourceMappingURL=chat.js.map