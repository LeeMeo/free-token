import { OpenCodeRequest, OpenCodeResponse } from './types';
export declare function createRequest(id: string, instruction: string, workspace: string, history: Array<{
    role: string;
    content: string;
}>, tools: string[], timeout: number, model?: string): OpenCodeRequest;
export declare function parseResponse(line: string): OpenCodeResponse | null;
export interface ModelInfo {
    id: string;
    name: string;
    provider: string;
}
export declare const DEFAULT_MODELS: ModelInfo[];
export declare function getDefaultModel(): string;
export declare function setDefaultModel(modelId: string): boolean;
//# sourceMappingURL=protocol.d.ts.map