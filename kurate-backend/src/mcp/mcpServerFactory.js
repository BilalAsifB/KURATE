import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  listPrompts,
  getLatestPromptVersion,
  getPromptVersion,
  listPromptVersions,
} from "../database/repository.js";

export function parseNamespacedRef(ref) {
  const match = ref.match(/^(.+)-v(\d+)$/);
  if (match) {
    return { namespace: match[1], version: Number(match[2]) };
  }
  return { namespace: ref, version: null };
}

async function listKurateResources() {
  const prompts = await listPrompts();
  const resources = [];

  for (const prompt of prompts) {
    resources.push({
      uri: `kurate://${prompt.namespace}`,
      name: prompt.title || prompt.namespace,
      description: `Latest version (v${prompt.latest_version}) of ${prompt.namespace}`,
      mimeType: "text/markdown",
    });

    const versions = await listPromptVersions(prompt.namespace);
    for (const v of versions) {
      resources.push({
        uri: `kurate://${prompt.namespace}-v${v.version}`,
        name: `${prompt.title || prompt.namespace} (v${v.version})`,
        description: prompt.description || undefined,
        mimeType: "text/markdown",
      });
    }
  }

  return { resources };
}

export function createKurateMcpServer() {
  const server = new McpServer({ name: "kurate", version: "1.0.0" });

  server.registerResource(
    "kurate-prompt",
    new ResourceTemplate("kurate://{namespacedRef}", { list: listKurateResources }),
    {
      title: "Kurate Compiled Context",
      description:
        "A compiled prompt context curated via the Kurate Context Cart. " +
        "Use 'kurate://<namespace>' for the latest version or " +
        "'kurate://<namespace>-v<N>' for an immutable historical version.",
      mimeType: "text/markdown",
    },
    async (uri, { namespacedRef }) => {
      const { namespace, version } = parseNamespacedRef(namespacedRef);

      const record = version
        ? await getPromptVersion(namespace, version)
        : await getLatestPromptVersion(namespace);

      if (!record) {
        throw new Error(`No prompt found for '${uri.href}'.`);
      }

      return {
        contents: [{ uri: uri.href, mimeType: "text/markdown", text: record.compiled_prompt }],
      };
    }
  );

  server.registerTool(
    "kurate_get_context",
    {
      title: "Get Kurate Context",
      description:
        "Fetch a compiled context from the Kurate registry by namespace " +
        "(and optional version). Returns the curated Markdown — including " +
        "tables and hosted image URLs — ready to paste into the conversation.",
      inputSchema: {
        namespace: z.string().describe("The prompt namespace, e.g. 'api-docs'"),
        version: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("Specific immutable version. Omit for the latest version."),
      },
    },
    async ({ namespace, version }) => {
      const record = version
        ? await getPromptVersion(namespace, version)
        : await getLatestPromptVersion(namespace);

      if (!record) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `No prompt found for namespace '${namespace}'${
                version ? ` at version ${version}` : ""
              }.`,
            },
          ],
        };
      }

      return { content: [{ type: "text", text: record.compiled_prompt }] };
    }
  );

  server.registerTool(
    "kurate_list_contexts",
    {
      title: "List Kurate Contexts",
      description: "List all saved Kurate namespaces and their latest version numbers.",
      inputSchema: {},
    },
    async () => {
      const prompts = await listPrompts();
      const summary = prompts.map(
        (p) => `- ${p.namespace} (latest: v${p.latest_version})${p.title ? ` — ${p.title}` : ""}`
      );

      return {
        content: [
          { type: "text", text: summary.length ? summary.join("\n") : "No saved contexts yet." },
        ],
      };
    }
  );

  return server;
}