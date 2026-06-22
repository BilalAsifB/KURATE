import { Router } from "express";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { createKurateMcpServer } from "../mcp/mcpServerFactory.js";

const router = Router();
const sessions = {};

async function handleMcpRequest(req, res) {
  const sessionId = req.headers["mcp-session-id"];
  let entry = sessionId ? sessions[sessionId] : undefined;

  if (!entry) {
    if (!isInitializeRequest(req.body)) {
      return res.status(400).json({
        jsonrpc: "2.0",
        error: { code: -32000, message: "No active session. Send an 'initialize' request first." },
        id: req.body?.id ?? null,
      });
    }
    const server = createKurateMcpServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (id) => { sessions[id] = { server, transport }; },
    });
    transport.onclose = () => { if (transport.sessionId) delete sessions[transport.sessionId]; };
    await server.connect(transport);
    entry = { server, transport };
  }

  await entry.transport.handleRequest(req, res, req.body);
}

router.post("/", handleMcpRequest);

router.get("/", async (req, res) => {
  const entry = sessions[req.headers["mcp-session-id"]];
  if (!entry) return res.status(400).json({ error: "Unknown or missing mcp-session-id." });
  await entry.transport.handleRequest(req, res);
});

router.delete("/", async (req, res) => {
  const entry = sessions[req.headers["mcp-session-id"]];
  if (!entry) return res.status(400).json({ error: "Unknown or missing mcp-session-id." });
  await entry.transport.handleRequest(req, res);
});

export default router;