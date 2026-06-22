import {
  createPromptVersion, getPromptByNamespace, getLatestPromptVersion,
  getPromptVersion, listPrompts, listPromptVersions, getChunksByIds,
} from "../database/repository.js";
import { compilePrompt, resolveCartItems } from "../services/promptCompiler.js";
import { savePromptVersionSchema, validate } from "../validation/validation.js";

export async function savePromptVersion(req, res, next) {
  try {
    const payload = validate(savePromptVersionSchema, req.body);
    const chunkIds = payload.cart_items.map((item) => item.chunk_id);
    const chunkRows = await getChunksByIds(chunkIds);

    if (chunkRows.length !== new Set(chunkIds).size) {
      return res.status(400).json({ error: "One or more cart_items reference chunks that no longer exist." });
    }

    const resolvedItems = resolveCartItems(payload.cart_items, chunkRows);
    const compiledPrompt = compilePrompt({ instructions: payload.instructions, items: resolvedItems });

    const { prompt, version } = await createPromptVersion({
      namespace: payload.namespace,
      title: payload.title,
      description: payload.description,
      instructions: payload.instructions,
      cartItems: payload.cart_items,
      compiledPrompt,
    });

    res.status(201).json({ prompt, version, uri: `kurate://${prompt.namespace}-v${version.version}` });
  } catch (err) { next(err); }
}

export async function listAllPrompts(req, res, next) {
  try {
    res.json({ prompts: await listPrompts() });
  } catch (err) { next(err); }
}

export async function listVersions(req, res, next) {
  try {
    const prompt = await getPromptByNamespace(req.params.namespace);
    if (!prompt) return res.status(404).json({ error: "Prompt not found." });
    const versions = await listPromptVersions(req.params.namespace);
    res.json({ prompt, versions });
  } catch (err) { next(err); }
}

export async function getPrompt(req, res, next) {
  try {
    const { namespace } = req.params;
    const { version } = req.query;
    const record = version
      ? await getPromptVersion(namespace, Number(version))
      : await getLatestPromptVersion(namespace);

    if (!record) return res.status(404).json({ error: "Prompt version not found." });

    res.json({
      uri: `kurate://${record.namespace}-v${record.version}`,
      namespace: record.namespace,
      title: record.title,
      description: record.description,
      version: record.version,
      instructions: record.instructions,
      cart_items: record.cart_items,
      compiled_prompt: record.compiled_prompt,
      created_at: record.created_at,
    });
  } catch (err) { next(err); }
}