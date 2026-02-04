"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const server_1 = require("./server/server");
const config_1 = require("./config/config");
const client_1 = require("./opencode/client");
async function main() {
    const opencodeClient = new client_1.OpenCodeClient();
    console.log('Initializing FreeClaw server...');
    console.log(`OpenCode Server: http://${config_1.config.opencodeServerHost}:${config_1.config.opencodeServerPort}`);
    const server = await (0, server_1.createServer)(opencodeClient);
    try {
        await server.listen({
            port: config_1.config.port,
            host: config_1.config.host
        });
        console.log(`FreeClaw server running at http://${config_1.config.host}:${config_1.config.port}`);
    }
    catch (error) {
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
//# sourceMappingURL=index.js.map