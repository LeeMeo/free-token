import { OpenCodeRequest, OpenCodeResponse } from './types';

let currentDefaultModel: string = 'minimax-m2.1-free';

export function createRequest(
  id: string,
  instruction: string,
  workspace: string,
  history: Array<{ role: string; content: string }>,
  tools: string[],
  timeout: number,
  model?: string
): OpenCodeRequest {
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

export function parseResponse(line: string): OpenCodeResponse | null {
  try {
    return JSON.parse(line) as OpenCodeResponse;
  } catch {
    return null;
  }
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
}

export const DEFAULT_MODELS: ModelInfo[] = [
  { id: 'big-pickle', name: 'Big Pickle', provider: 'opencode' },
  { id: 'trinity-large-preview-free', name: 'Trinity Large Preview', provider: 'opencode' },
  { id: 'gpt-5-nano', name: 'GPT-5 Nano', provider: 'opencode' },
  { id: 'glm-4.7-free', name: 'GLM-4.7 Free', provider: 'opencode' },
  { id: 'minimax-m2.1-free', name: 'MiniMax M2.1 Free', provider: 'opencode' },
  { id: 'kimi-k2.5-free', name: 'Kimi K2.5 Free', provider: 'opencode' }
];

export function getDefaultModel(): string {
  return currentDefaultModel;
}

export function setDefaultModel(modelId: string): boolean {
  const exists = DEFAULT_MODELS.some(m => m.id === modelId);
  if (exists) {
    const oldModel = currentDefaultModel;
    currentDefaultModel = modelId;
    console.log(`[ModelManager] Model switched: ${oldModel} → ${modelId} (${new Date().toISOString()})`);
    return true;
  }
  return false;
}
