#!/usr/bin/env node
/**
 * Kurate MCP Server (stdio transport)
 *
 * Exposes saved prompt versions from the Kurate registry as MCP resources
 * addressable via `kurate://<namespace>-v<version>` (or `kurate://<namespace>`
 * for the latest version). External AI workspaces (Claude Desktop, Cursor,
 * Windsurf) spawn this as a local child process over stdio and can
 * `resources/list` / `resources/read` to pull the exact compiled Markdown
 * context — including hosted table/image asset URLs — directly into their
 * LLM context window.
 *
 * Run standalone:
 *   node src/mcp-server.js
 *
 * Configure in an MCP client (e.g. Claude Desktop config):
 *   {
 *     "mcpServers": {
 *       "kurate": {
 *         "command": "node",
 *         "args": ["/absolute/path/to/kurate-backend/src/mcp-server.js"],
 *         "env": { "DATABASE_URL": "postgres://..." }
 *       }
 *     }
 *   }
 *
 * For remote/HTTP access, see src/routes/mcp.js, which mounts the same
 * server (via createKurateMcpServer) on a Streamable HTTP endpoint.
 */

import "dotenv/config";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createKurateMcpServer } from "./mcp/mcpServerFactory.js";

const server = createKurateMcpServer();
const transport = new StdioServerTransport();
await server.connect(transport);