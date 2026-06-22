#!/usr/bin/env node
/**
 * Kurate MCP Server — stdio transport for Claude Desktop / Cursor / Windsurf.
 *
 * Configure in your MCP client:
 * {
 *   "mcpServers": {
 *     "kurate": {
 *       "command": "node",
 *       "args": ["/absolute/path/to/kurate-backend/src/mcp-server.js"],
 *       "env": { "DATABASE_URL": "postgres://..." }
 *     }
 *   }
 * }
 */
import "dotenv/config";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createKurateMcpServer } from "./mcp/mcpServerFactory.js";

const server = createKurateMcpServer();
const transport = new StdioServerTransport();
await server.connect(transport);