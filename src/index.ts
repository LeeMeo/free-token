import 'dotenv/config';

import { createServer } from './server/server';
import { config } from './config/config';
import { OpenCodeClient } from './opencode/client';

async function main() {
  const opencodeClient = new OpenCodeClient();

  console.log('Initializing FreeClaw server...');
  console.log(`OpenCode Server: http://${config.opencodeServerHost}:${config.opencodeServerPort}`);

  const server = await createServer(opencodeClient);

  try {
    await server.listen({
      port: config.port,
      host: config.host
    });
    console.log(`FreeClaw server running at http://${config.host}:${config.port}`);
  } catch (error) {
    console.error('Failed to start server:', error);
    opencodeClient.disconnect();
    process.exit(1);
  }

  const shutdown = async () => {
    console.log('Shutting down...');
    opencodeClient.disconnect();
    await server.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main();
