import { OpenCodeChunk } from './types';
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
export declare class OpenCodeClient {
    private baseUrl;
    private authHeader;
    private sessionId;
    constructor();
    private request;
    createSession(title?: string): Promise<SessionInfo>;
    sendMessage(instruction: string | Array<{
        type: string;
        text: unknown;
    }>, model?: string, agent?: string): Promise<SendMessageResponse>;
    execute(instruction: string | Array<{
        type: string;
        text: unknown;
    }>, _workspace: string, _history: Array<{
        role: string;
        content: string;
    }>, _tools: string[], _timeout: number, _signal?: AbortSignal, model?: string): AsyncGenerator<OpenCodeChunk>;
    getProviders(): Promise<{
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
    }>;
    getSessionId(): string | null;
    disconnect(): void;
    getHealthStatus(): boolean;
}
export {};
//# sourceMappingURL=client.d.ts.map