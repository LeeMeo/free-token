export interface SessionContext {
    sessionId: string;
    workspace: string;
    messages: Array<{
        role: 'system' | 'user' | 'assistant';
        content: string;
    }>;
    enabledTools: string[];
    createdAt: Date;
    lastActive: Date;
}
export declare class ContextManager {
    private sessions;
    private readonly maxTokens;
    constructor(maxTokens?: number);
    createSession(sessionId: string, workspace: string, systemMessage: string): SessionContext;
    getSession(sessionId: string): SessionContext | undefined;
    addMessage(sessionId: string, role: 'user' | 'assistant', content: string): boolean;
    getHistory(sessionId: string): Array<{
        role: string;
        content: string;
    }>;
    private pruneIfNeeded;
    private estimateTokens;
    removeSession(sessionId: string): void;
    cleanupOldSessions(maxAge: number): void;
}
//# sourceMappingURL=manager.d.ts.map