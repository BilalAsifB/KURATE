import { create } from "zustand";

export const useCartStore = create((set, get) => ({
  items: [],
  instructions: "",
  namespace: "",
  title: "",
  description: "",

  addChunk: (chunk) => {
    const { items } = get();
    if (items.some((item) => item.chunk_id === chunk.id)) return;
    set({ items: [...items, { chunk_id: chunk.id, order: items.length, chunk }] });
  },

  removeChunk: (chunkId) => {
    const filtered = get().items.filter((item) => item.chunk_id !== chunkId);
    set({ items: reindex(filtered) });
  },

  toggleChunk: (chunk) => {
    const exists = get().items.some((item) => item.chunk_id === chunk.id);
    if (exists) get().removeChunk(chunk.id);
    else get().addChunk(chunk);
  },

  reorder: (orderedChunkIds) => {
    const byId = new Map(get().items.map((item) => [item.chunk_id, item]));
    const reordered = orderedChunkIds.map((id) => byId.get(id)).filter(Boolean);
    set({ items: reindex(reordered) });
  },

  isInCart: (chunkId) => get().items.some((item) => item.chunk_id === chunkId),

  setInstructions: (instructions) => set({ instructions }),
  setNamespace: (namespace) => set({ namespace }),
  setTitle: (title) => set({ title }),
  setDescription: (description) => set({ description }),

  clear: () => set({ items: [], instructions: "", namespace: "", title: "", description: "" }),

  loadFromVersion: ({ instructions, cartItems, chunksById, namespace, title, description }) => {
    const items = (cartItems || [])
      .map((ci) => ({ chunk_id: ci.chunk_id, order: ci.order, chunk: chunksById?.[ci.chunk_id] || null }))
      .filter((item) => item.chunk !== null)
      .sort((a, b) => a.order - b.order);
    set({ items: reindex(items), instructions: instructions || "", namespace: namespace || "", title: title || "", description: description || "" });
  },
}));

function reindex(items) {
  return items.map((item, idx) => ({ ...item, order: idx }));
}