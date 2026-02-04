"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextManager = void 0;
class ContextManager {
    constructor(maxTokens = 16000) {
        this.sessions = new Map();
        this.maxTokens = maxTokens;
    }
    createSession(sessionId, workspace, systemMessage) {
        const session = {
            sessionId,
            workspace,
            messages: [
                { role: 'system', content: systemMessage }
            ],
            enabledTools: ['read', 'write', 'bash', 'grep', 'glob', 'task'],
            createdAt: new Date(),
            lastActive: new Date()
        };
        this.sessions.set(sessionId, session);
        return session;
    }
    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }
    addMessage(sessionId, role, content) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return false;
        session.messages.push({ role, content });
        session.lastActive = new Date();
        this.pruneIfNeeded(session);
        return true;
    }
    getHistory(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return [];
        return session.messages.map(m => ({ role: m.role, content: m.content }));
    }
    pruneIfNeeded(session) {
        while (this.estimateTokens(session.messages) > this.maxTokens) {
            const systemIdx = session.messages.findIndex(m => m.role === 'system');
            const removeIdx = systemIdx === 0 ? 2 : 1;
            if (removeIdx < session.messages.length) {
                session.messages.splice(removeIdx, 1);
            }
            else {
                break;
            }
        }
    }
    estimateTokens(messages) {
        const text = messages.map(m => m.content).join(' ');
        return Math.ceil(text.length / 4);
    }
    removeSession(sessionId) {
        this.sessions.delete(sessionId);
    }
    cleanupOldSessions(maxAge) {
        const now = Date.now();
        for (const [sessionId, session] of this.sessions) {
            if (now - session.lastActive.getTime() > maxAge) {
                this.sessions.delete(sessionId);
            }
        }
    }
}
exports.ContextManager = ContextManager;
//# sourceMappingURL=manager.js.map