"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenCodeClient = void 0;
const config_1 = require("../config/config");
class OpenCodeClient {
    constructor() {
        this.sessionId = null;
        this.baseUrl = `http://${config_1.config.opencodeServerHost}:${config_1.config.opencodeServerPort}`;
        // 如果没有设置密码，则不使用认证
        if (config_1.config.opencodeServerPassword) {
            this.authHeader = 'Basic ' + Buffer.from(`${config_1.config.opencodeServerUsername}:${config_1.config.opencodeServerPassword}`).toString('base64');
        }
        else {
            this.authHeader = '';
        }
    }
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const response = await fetch(url, {
            ...options,
            headers: {
                ...(this.authHeader && { 'Authorization': this.authHeader }),
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        return response.json();
    }
    async createSession(title) {
        const response = await this.request('/session', {
            method: 'POST',
            body: JSON.stringify({ title }),
        });
        this.sessionId = response.id;
        return response;
    }
    async sendMessage(instruction, model, agent) {
        if (!this.sessionId) {
            throw new Error('No session created. Call createSession() first.');
        }
        let textContent;
        if (typeof instruction === 'string') {
            textContent = instruction;
        }
        else if (Array.isArray(instruction)) {
            textContent = instruction.map((part) => typeof part.text === 'string' ? part.text : String(part.text)).join('\n');
        }
        else {
            textContent = String(instruction);
        }
        const body = {
            parts: [{ type: 'text', text: textContent }],
        };
        if (model) {
            body.model = {
                providerID: 'opencode',
                modelID: model
            };
        }
        if (agent) {
            body.agent = agent;
        }
        const response = await this.request(`/session/${this.sessionId}/message`, {
            method: 'POST',
            body: JSON.stringify(body),
        });
        return response;
    }
    async *execute(instruction, _workspace, _history, _tools, _timeout, _signal, model) {
        console.log('[FreeClaw] ===== execute() START =====');
        console.log('[FreeClaw] instruction:', JSON.stringify(instruction).substring(0, 200));
        console.log('[FreeClaw] model:', model);
        console.log('[FreeClaw] baseUrl:', this.baseUrl);
        try {
            console.log('[FreeClaw] Creating session...');
            await this.createSession('FreeClaw API Request');
            console.log('[FreeClaw] Session created, sessionId:', this.sessionId);
            console.log('[FreeClaw] Sending message...');
            const response = await this.sendMessage(instruction, model);
            console.log('[FreeClaw] Response received:');
            console.log('[FreeClaw]   - info.error:', response.info.error);
            console.log('[FreeClaw]   - parts.length:', response.parts.length);
            if (response.info.error) {
                console.log('[FreeClaw] Error in response:', response.info.error);
                yield {
                    content: '',
                    done: true,
                    error: response.info.error.message || response.info.error.name,
                };
                console.log('[FreeClaw] ===== execute() END (error) =====');
                return;
            }
            console.log('[FreeClaw] Processing parts...');
            for (const part of response.parts) {
                console.log('[FreeClaw]   part.type:', part.type, 'text:', part.text?.substring(0, 100));
                if (part.type === 'text' && part.text) {
                    yield { content: part.text, done: false };
                }
                else if (part.type === 'reasoning' && part.text) {
                    yield { content: part.text, done: false };
                }
            }
            console.log('[FreeClaw] ===== execute() END (done) =====');
            yield { content: '', done: true };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.log('[FreeClaw] Exception:', errorMessage);
            console.log('[FreeClaw] ===== execute() END (exception) =====');
            yield { content: '', done: true, error: errorMessage };
        }
    }
    async getProviders() {
        return this.request('/config/providers');
    }
    getSessionId() {
        return this.sessionId;
    }
    disconnect() {
        this.sessionId = null;
    }
    getHealthStatus() {
        return true;
    }
}
exports.OpenCodeClient = OpenCodeClient;
//# sourceMappingURL=client.js.map