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

export function mapToOpenAIChunk(
  chunk: OpenCodeChunk,
  id: string,
  model: string
): ChatCompletionChunk {
  return {
    id,
    object: 'chat.completion.chunk',
    created: Date.now(),
    model,
    choices: [{
      index: 0,
      delta: {
        content: chunk.done ? null : chunk.content
      },
      finish_reason: chunk.done ? 'stop' : null
    }]
  };
}

export function createFinalChunk(id: string, model: string): ChatCompletionChunk {
  return {
    id,
    object: 'chat.completion.chunk',
    created: Date.now(),
    model,
    choices: [{
      index: 0,
      delta: {
        content: null
      },
      finish_reason: 'stop'
    }]
  };
}
