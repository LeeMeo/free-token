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

export class ContextManager {
  private sessions = new Map<string, SessionContext>();
  private readonly maxTokens: number;

  constructor(maxTokens = 16000) {
    this.maxTokens = maxTokens;
  }

  createSession(sessionId: string, workspace: string, systemMessage: string): SessionContext {
    const session: SessionContext = {
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

  getSession(sessionId: string): SessionContext | undefined {
    return this.sessions.get(sessionId);
  }

  addMessage(sessionId: string, role: 'user' | 'assistant', content: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.messages.push({ role, content });
    session.lastActive = new Date();
    this.pruneIfNeeded(session);
    return true;
  }

  getHistory(sessionId: string): Array<{ role: string; content: string }> {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    return session.messages.map(m => ({ role: m.role, content: m.content }));
  }

  private pruneIfNeeded(session: SessionContext): void {
    while (this.estimateTokens(session.messages) > this.maxTokens) {
      const systemIdx = session.messages.findIndex(m => m.role === 'system');
      const removeIdx = systemIdx === 0 ? 2 : 1;
      if (removeIdx < session.messages.length) {
        session.messages.splice(removeIdx, 1);
      } else {
        break;
      }
    }
  }

  private estimateTokens(messages: Array<{ content: string }>): number {
    const text = messages.map(m => m.content).join(' ');
    return Math.ceil(text.length / 4);
  }

  removeSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  cleanupOldSessions(maxAge: number): void {
    const now = Date.now();
    for (const [sessionId, session] of this.sessions) {
      if (now - session.lastActive.getTime() > maxAge) {
        this.sessions.delete(sessionId);
      }
    }
  }
}
