export interface OpenCodeRequest {
  jsonrpc: '2.0';
  id: string;
  method: 'execute';
  params: {
    instruction: string;
    context: {
      workspace: string;
      history: Array<{ role: string; content: string }>;
    };
    options: {
      tools: string[];
      timeout: number;
      stream: boolean;
    };
  };
}

export interface OpenCodeResponse {
  jsonrpc: '2.0';
  id: string;
  params?: {
    type: 'stdout' | 'done' | 'error';
    content?: string;
    result?: { success: boolean };
    error?: string;
  };
  error?: {
    code: number;
    message: string;
    data?: string;
  };
}

export interface OpenCodeChunk {
  content: string;
  done: boolean;
  error?: string;
}
