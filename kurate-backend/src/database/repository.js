import { query, withTransaction } from "../config/db.js";

// --- documents ---

export async function createDocument({ filename, sourceType }) {
  const { rows } = await query(
    `INSERT INTO documents (filename, source_type, status)
     VALUES ($1, $2, 'processing') RETURNING *`,
    [filename, sourceType]
  );
  return rows[0];
}

export async function markDocumentReady({ documentId, markdown, assetCount }) {
  const { rows } = await query(
    `UPDATE documents SET status = 'ready', markdown = $2, asset_count = $3
     WHERE id = $1 RETURNING *`,
    [documentId, markdown, assetCount]
  );
  return rows[0];
}

export async function markDocumentFailed({ documentId, errorMessage }) {
  const { rows } = await query(
    `UPDATE documents SET status = 'failed', error_message = $2
     WHERE id = $1 RETURNING *`,
    [documentId, errorMessage]
  );
  return rows[0];
}

export async function getDocumentById(documentId) {
  const { rows } = await query(`SELECT * FROM documents WHERE id = $1`, [documentId]);
  return rows[0] || null;
}

export async function listDocuments() {
  const { rows } = await query(
    `SELECT id, filename, source_type, status, asset_count, created_at, updated_at
     FROM documents ORDER BY created_at DESC`
  );
  return rows;
}

export async function deleteDocument(documentId) {
  const { rowCount } = await query(`DELETE FROM documents WHERE id = $1`, [documentId]);
  return rowCount > 0;
}

// --- chunks ---

export async function insertChunks(documentId, chunks) {
  if (!chunks.length) return [];
  return withTransaction(async (client) => {
    const inserted = [];
    for (const chunk of chunks) {
      const { rows } = await client.query(
        `INSERT INTO chunks (document_id, chunk_order, type, content, metadata)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [documentId, chunk.order, chunk.type, chunk.content, JSON.stringify(chunk.metadata || {})]
      );
      inserted.push(rows[0]);
    }
    return inserted;
  });
}

export async function getChunksByDocumentId(documentId) {
  const { rows } = await query(
    `SELECT * FROM chunks WHERE document_id = $1 ORDER BY chunk_order ASC`,
    [documentId]
  );
  return rows;
}

export async function getChunksByIds(chunkIds) {
  if (!chunkIds.length) return [];
  const { rows } = await query(
    `SELECT * FROM chunks WHERE id = ANY($1::uuid[])`,
    [chunkIds]
  );
  return rows;
}

// --- prompts & prompt_versions ---

export async function getPromptByNamespace(namespace) {
  const { rows } = await query(`SELECT * FROM prompts WHERE namespace = $1`, [namespace]);
  return rows[0] || null;
}

export async function listPrompts() {
  const { rows } = await query(`SELECT * FROM prompts ORDER BY updated_at DESC`);
  return rows;
}

export async function createPromptVersion({
  namespace, title, description, instructions, cartItems, compiledPrompt,
}) {
  return withTransaction(async (client) => {
    let { rows } = await client.query(
      `SELECT * FROM prompts WHERE namespace = $1 FOR UPDATE`,
      [namespace]
    );
    let prompt = rows[0];

    if (!prompt) {
      const r = await client.query(
        `INSERT INTO prompts (namespace, title, description, latest_version)
         VALUES ($1, $2, $3, 0) RETURNING *`,
        [namespace, title || namespace, description || null]
      );
      prompt = r.rows[0];
    } else if (title || description) {
      const r = await client.query(
        `UPDATE prompts SET title = COALESCE($2, title), description = COALESCE($3, description)
         WHERE id = $1 RETURNING *`,
        [prompt.id, title || null, description || null]
      );
      prompt = r.rows[0];
    }

    const nextVersion = prompt.latest_version + 1;

    const versionResult = await client.query(
      `INSERT INTO prompt_versions (prompt_id, version, instructions, cart_items, compiled_prompt)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [prompt.id, nextVersion, instructions || "", JSON.stringify(cartItems || []), compiledPrompt]
    );

    await client.query(
      `UPDATE prompts SET latest_version = $2 WHERE id = $1`,
      [prompt.id, nextVersion]
    );

    return { prompt: { ...prompt, latest_version: nextVersion }, version: versionResult.rows[0] };
  });
}

export async function getPromptVersion(namespace, version) {
  const { rows } = await query(
    `SELECT pv.*, p.namespace, p.title, p.description
     FROM prompt_versions pv JOIN prompts p ON p.id = pv.prompt_id
     WHERE p.namespace = $1 AND pv.version = $2`,
    [namespace, version]
  );
  return rows[0] || null;
}

export async function getLatestPromptVersion(namespace) {
  const { rows } = await query(
    `SELECT pv.*, p.namespace, p.title, p.description
     FROM prompt_versions pv JOIN prompts p ON p.id = pv.prompt_id
     WHERE p.namespace = $1 ORDER BY pv.version DESC LIMIT 1`,
    [namespace]
  );
  return rows[0] || null;
}

export async function listPromptVersions(namespace) {
  const { rows } = await query(
    `SELECT pv.id, pv.version, pv.instructions, pv.cart_items, pv.created_at
     FROM prompt_versions pv JOIN prompts p ON p.id = pv.prompt_id
     WHERE p.namespace = $1 ORDER BY pv.version DESC`,
    [namespace]
  );
  return rows;
}