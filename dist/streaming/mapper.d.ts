import { OpenCodeChunk } from '../opencode/types';
export interface ChatCompletionChunk {
    id: string;
    object: 'chat.completion.chunk';
    created: number;
    model: string;
    choices: Array<{
        index: number;
        delta: {
            content: string | null;
            role?: string;
        };
        finish_reason: string | null;
    }>;
}
export declare function mapToOpenAIChunk(chunk: OpenCodeChunk, id: string, model: string): ChatCompletionChunk;
export declare function createFinalChunk(id: string, model: string): ChatCompletionChunk;
//# sourceMappingURL=mapper.d.ts.map