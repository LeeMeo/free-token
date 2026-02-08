import { getDefaultModel } from '../opencode/protocol';

export interface Config {
  host: string;
  port: number;
  opencodePath: string;
  opencodeServerHost: string;
  opencodeServerPort: number;
  opencodeServerUsername: string;
  opencodeServerPassword: string;
  maxTokens: number;
  sessionTimeout: number;
  defaultTools: string[];
  requestTimeout: number;
  defaultModel: string;
  disableContextPruning: boolean;
}

function getOpenCodePath(): string {
  if (process.env.OPENCODE_PATH) {
    return process.env.OPENCODE_PATH;
  }

  const platform = process.platform;
  const arch = process.arch;

  const paths: Record<string, string> = {
    'win32-x64': 'D:\\AI\\bin\\OpenCode\\opencode-cli.exe',
    'win32-arm64': 'D:\\AI\\bin\\OpenCode\\opencode-cli.exe',
    'linux-x64': '~/.opencode/bin/opencode',
    'linux-arm64': '~/.opencode/bin/opencode',
    'darwin-x64': '~/.opencode/bin/opencode',
    'darwin-arm64': '~/.opencode/bin/opencode'
  };

  const key = `${platform}-${arch}`;
  return paths[key] || 'opencode';
}

export const config: Config = {
  host: process.env.HOST || '0.0.0.0',
  port: parseInt(process.env.PORT || '3000', 10),
  opencodePath: getOpenCodePath(),
  opencodeServerHost: process.env.OPENCODE_SERVER_HOST || '127.0.0.1',
  opencodeServerPort: parseInt(process.env.OPENCODE_SERVER_PORT || '4096', 10),
  opencodeServerUsername: process.env.OPENCODE_SERVER_USERNAME || 'opencode',
  opencodeServerPassword: process.env.OPENCODE_SERVER_PASSWORD || '',
  maxTokens: parseInt(process.env.MAX_TOKENS || '16000', 10),
  sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '3600000', 10),
  defaultTools: (process.env.DEFAULT_TOOLS || 'read,write,bash,grep,glob,task').split(','),
  requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '300000', 10),
  get defaultModel() {
    return getDefaultModel();
  },
  disableContextPruning: process.env.DISABLE_CONTEXT_PRUNING !== 'false'
};
