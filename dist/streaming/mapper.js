"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapToOpenAIChunk = mapToOpenAIChunk;
exports.createFinalChunk = createFinalChunk;
function mapToOpenAIChunk(chunk, id, model) {
    return {
        id,
        object: 'chat.completion.chunk',
        created: Date.now(),
        model,
        choices: [{
                index: 0,
                delta: {
                    content: chunk.done ? null : chunk.content
                },
                finish_reason: chunk.done ? 'stop' : null
            }]
    };
}
function createFinalChunk(id, model) {
    return {
        id,
        object: 'chat.completion.chunk',
        created: Date.now(),
        model,
        choices: [{
                index: 0,
                delta: {
                    content: null
                },
                finish_reason: 'stop'
            }]
    };
}
//# sourceMappingURL=mapper.js.map