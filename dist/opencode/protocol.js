"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_MODELS = void 0;
exports.createRequest = createRequest;
exports.parseResponse = parseResponse;
exports.getDefaultModel = getDefaultModel;
exports.setDefaultModel = setDefaultModel;
let currentDefaultModel = 'big-pickle';
function createRequest(id, instruction, workspace, history, tools, timeout, model) {
    return {
        jsonrpc: '2.0',
        id,
        method: 'execute',
        params: {
            instruction,
            context: {
                workspace,
                history
            },
            options: {
                tools,
                timeout,
                stream: true,
                ...(model && { model })
            }
        }
    };
}
function parseResponse(line) {
    try {
        return JSON.parse(line);
    }
    catch {
        return null;
    }
}
exports.DEFAULT_MODELS = [
    { id: 'big-pickle', name: 'Big Pickle', provider: 'opencode' },
    { id: 'trinity-large-preview-free', name: 'Trinity Large Preview', provider: 'opencode' },
    { id: 'gpt-5-nano', name: 'GPT-5 Nano', provider: 'opencode' },
    { id: 'glm-4.7-free', name: 'GLM-4.7 Free', provider: 'opencode' },
    { id: 'minimax-m2.1-free', name: 'MiniMax M2.1 Free', provider: 'opencode' },
    { id: 'kimi-k2.5-free', name: 'Kimi K2.5 Free', provider: 'opencode' }
];
function getDefaultModel() {
    return currentDefaultModel;
}
function setDefaultModel(modelId) {
    const exists = exports.DEFAULT_MODELS.some(m => m.id === modelId);
    if (exists) {
        currentDefaultModel = modelId;
        return true;
    }
    return false;
}
//# sourceMappingURL=protocol.js.map