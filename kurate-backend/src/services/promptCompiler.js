export function compilePrompt({ instructions, items }) {
  const sections = [];

  if (instructions && instructions.trim()) {
    sections.push(instructions.trim());
  }

  for (const item of items) {
    const rendered = renderChunk(item.chunk);
    if (rendered) sections.push(rendered);
  }

  return sections.join("\n\n");
}

function renderChunk(chunk) {
  if (!chunk) return "";

  switch (chunk.type) {
    case "image": {
      const alt = chunk.metadata?.caption || "image";
      return chunk.content ? `![${alt}](${chunk.content})` : "";
    }
    default:
      return chunk.content;
  }
}

export function resolveCartItems(cartItems, chunkRows) {
  const chunkMap = new Map(chunkRows.map((c) => [c.id, c]));

  return [...cartItems]
    .sort((a, b) => a.order - b.order)
    .map((item) => ({
      order: item.order,
      chunk: chunkMap.get(item.chunk_id) || null,
    }))
    .filter((item) => item.chunk !== null);
}