import fs from 'node:fs';
import path from 'node:path';

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
  private readonly storagePath: string;
  private readonly sessionTimeout: number;
  private readonly disablePruning: boolean;

  constructor(maxTokens = 16000, sessionTimeout = 3600000, storagePath = './sessions', disablePruning = false) {
    this.maxTokens = maxTokens;
    this.sessionTimeout = sessionTimeout;
    this.storagePath = storagePath;
    this.disablePruning = disablePruning;
    this.initStorage();
    this.loadSessions();
  }

  private initStorage(): void {
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
    }
  }

  private getSessionPath(sessionId: string): string {
    return path.join(this.storagePath, `${sessionId}.json`);
  }

  private saveSession(session: SessionContext): void {
    try {
      const filePath = this.getSessionPath(session.sessionId);
      fs.writeFileSync(filePath, JSON.stringify(session, null, 2));
    } catch (error) {
      console.error(`[ContextManager] Failed to save session ${session.sessionId}:`, error);
    }
  }

  private loadSessions(): void {
    if (!fs.existsSync(this.storagePath)) {
      return;
    }

    try {
      const files = fs.readdirSync(this.storagePath).filter(f => f.endsWith('.json'));
      let loadedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.storagePath, file);
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const session = JSON.parse(content) as SessionContext;
          session.createdAt = new Date(session.createdAt);
          session.lastActive = new Date(session.lastActive);
          this.sessions.set(session.sessionId, session);
          loadedCount++;
        } catch (error) {
          console.error(`[ContextManager] Failed to load session ${file}:`, error);
        }
      }

      if (loadedCount > 0) {
        console.log(`[ContextManager] Loaded ${loadedCount} sessions from disk`);
      }
    } catch (error) {
      console.error('[ContextManager] Failed to load sessions:', error);
    }
  }

  createSession(sessionId: string, workspace: string, systemMessage: string): SessionContext {
    let session = this.sessions.get(sessionId);

    if (session) {
      session.lastActive = new Date();
      this.saveSession(session);
      return session;
    }

    session = {
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
    this.saveSession(session);
    console.log(`[ContextManager] Created new session: ${sessionId}`);
    return session;
  }

  getSession(sessionId: string): SessionContext | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActive = new Date();
    }
    return session;
  }

  addMessage(sessionId: string, role: 'user' | 'assistant', content: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.messages.push({ role, content });
    session.lastActive = new Date();
    this.pruneIfNeeded(session);
    this.saveSession(session);
    return true;
  }

  getHistory(sessionId: string): Array<{ role: string; content: string }> {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    return session.messages.map(m => ({ role: m.role, content: m.content }));
  }

  private pruneIfNeeded(session: SessionContext): void {
    if (this.disablePruning) return;

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
    try {
      const filePath = this.getSessionPath(sessionId);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error(`[ContextManager] Failed to delete session file ${sessionId}:`, error);
    }
  }

  cleanupOldSessions(maxAge?: number): number {
    const timeout = maxAge ?? this.sessionTimeout;
    const now = Date.now();
    let cleanedCount = 0;

    for (const [sessionId, session] of this.sessions) {
      if (now - session.lastActive.getTime() > timeout) {
        this.removeSession(sessionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`[ContextManager] Cleaned up ${cleanedCount} expired sessions`);
    }

    return cleanedCount;
  }
}
