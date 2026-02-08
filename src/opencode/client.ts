import { OpenCodeChunk } from './types';
import { config } from '../config/config';
import fs from 'node:fs';
import path from 'node:path';

interface SessionInfo {
  id: string;
  slug: string;
  title: string;
  directory: string;
  time: {
    created: number;
    updated: number;
  };
}

interface MessagePart {
  id: string;
  type: 'text' | 'step-start' | 'step-stop' | 'reasoning' | 'tool-call' | 'tool-result' | 'error';
  text?: string;
  time?: {
    start: number;
    end?: number;
  };
}

interface MessageInfo {
  id: string;
  sessionID: string;
  role: 'user' | 'assistant';
  modelID: string;
  providerID: string;
  error?: {
    name: string;
    message: string;
    data?: Record<string, unknown>;
  };
}

interface SendMessageResponse {
  info: MessageInfo;
  parts: MessagePart[];
}

interface ExecuteParams {
  instruction: string | Array<{ type: string; text: unknown }>;
  workspace: string;
  history: Array<{ role: string; content: string }>;
  tools: string[];
  timeout: number;
  signal?: AbortSignal;
  model?: string;
  sessionId?: string;
}

const SESSION_FILE = './sessions/opencode-session-id.txt';

function getSessionIdFromFile(): string | null {
  try {
    if (fs.existsSync(SESSION_FILE)) {
      const content = fs.readFileSync(SESSION_FILE, 'utf-8').trim();
      if (content) {
        console.log('[FreeClaw] Loaded sessionId from file:', content);
        return content;
      }
    }
  } catch (error) {
    console.log('[FreeClaw] Failed to load sessionId from file:', error);
  }
  return null;
}

function saveSessionIdToFile(sessionId: string): void {
  try {
    fs.writeFileSync(SESSION_FILE, sessionId, 'utf-8');
    console.log('[FreeClaw] Saved sessionId to file:', sessionId);
  } catch (error) {
    console.log('[FreeClaw] Failed to save sessionId to file:', error);
  }
}

export class OpenCodeClient {
  private baseUrl: string;
  private authHeader: string;
  private sessionId: string | null = null;

  constructor() {
    this.baseUrl = `http://${config.opencodeServerHost}:${config.opencodeServerPort}`;
    
    // 如果没有设置密码，则不使用认证
    if (config.opencodeServerPassword) {
      this.authHeader = 'Basic ' + Buffer.from(`${config.opencodeServerUsername}:${config.opencodeServerPassword}`).toString('base64');
    } else {
      this.authHeader = '';
    }

    // 从文件恢复 sessionId
    this.sessionId = getSessionIdFromFile();
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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

    return response.json() as Promise<T>;
  }

  async createSession(title?: string): Promise<SessionInfo> {
    const response = await this.request<SessionInfo>('/session', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
    this.sessionId = response.id;
    saveSessionIdToFile(response.id);
    return response;
  }

  async sendMessage(
    instruction: string | Array<{ type: string; text: unknown }>,
    model?: string,
    agent?: string
  ): Promise<SendMessageResponse> {
    if (!this.sessionId) {
      throw new Error('No session created. Call createSession() first.');
    }

    let textContent: string;
    if (typeof instruction === 'string') {
      textContent = instruction;
    } else if (Array.isArray(instruction)) {
      textContent = instruction.map((part: { type: string; text: unknown }) => 
        typeof part.text === 'string' ? part.text : String(part.text)
      ).join('\n');
    } else {
      textContent = String(instruction);
    }

    const body: Record<string, unknown> = {
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

    const response = await this.request<SendMessageResponse>(`/session/${this.sessionId}/message`, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    return response;
  }

  async *execute(params: ExecuteParams): AsyncGenerator<OpenCodeChunk> {
    const { instruction, workspace, history, tools, timeout, signal, model, sessionId } = params;

    console.log('[FreeClaw] ===== execute() START =====');
    console.log('[FreeClaw] instruction:', JSON.stringify(instruction).substring(0, 200));
    console.log('[FreeClaw] model:', model);
    console.log('[FreeClaw] history count:', history.length);
    console.log('[FreeClaw] workspace:', workspace);

    // 优先使用传入的 sessionId
    if (sessionId && sessionId !== this.sessionId) {
      console.log('[FreeClaw] Using provided sessionId:', sessionId);
      this.sessionId = sessionId;
      saveSessionIdToFile(sessionId);
    }

    try {
      // 检查是否有已有 session，直接复用
      if (this.sessionId) {
        console.log('[FreeClaw] Reusing existing session:', this.sessionId);
        
        // 直接发送消息，复用 session
        const response = await this.sendMessage(instruction, model);
        
        console.log('[FreeClaw] Response received:');
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
        }

        console.log('[FreeClaw] ===== execute() END (done) =====');
        yield { content: '', done: true };
        return;
      }

      // 没有 session，创建新的
      console.log('[FreeClaw] No existing session, creating new one...');
      await this.createSession('FreeClaw API Request');
      const response = await this.sendMessage(instruction, model);

      console.log('[FreeClaw] Response received:');
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
      }

      console.log('[FreeClaw] ===== execute() END (done) =====');
      yield { content: '', done: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log('[FreeClaw] Exception:', errorMessage);
      console.log('[FreeClaw] ===== execute() END (exception) =====');
      yield { content: '', done: true, error: errorMessage };
    }
  }

  async getProviders(): Promise<{
    providers: Array<{
      id: string;
      name: string;
      models: Record<string, {
        id: string;
        name: string;
        providerID: string;
      }>;
    }>;
    default: Record<string, string>;
  }> {
    return this.request('/config/providers');
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  disconnect(): void {
    this.sessionId = null;
  }

  getHealthStatus(): boolean {
    return true;
  }
}
