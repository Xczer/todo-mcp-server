#!/usr/bin/env node
// src/index.ts

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { TodoMcpServer } from './mcp-server.js';

async function main() {
  const dbPath = process.env.TODO_DB_PATH || 'todos.db';
  const todoMcpServer = new TodoMcpServer(dbPath);

  const transport = new StdioServerTransport();
  const server = todoMcpServer.getServer();

  console.error('Todo MCP Server starting...');
  console.error(`Database path: ${dbPath}`);

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.error('Shutting down...');
    await todoMcpServer.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.error('Shutting down...');
    await todoMcpServer.close();
    process.exit(0);
  });

  try {
    await server.connect(transport);
    console.error('Todo MCP Server connected and ready!');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
