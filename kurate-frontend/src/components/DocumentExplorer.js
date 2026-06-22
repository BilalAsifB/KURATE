import { useState, useMemo } from "react";
import {
  AlignLeft, Heading1, Table2, Image, Code2, Sigma, List, Plus, Minus, Search,
} from "lucide-react";
import { useCartStore } from "../store/useCartStore.js";
import DOMPurify from "dompurify";

const CHUNK_META = {
  heading:   { icon: Heading1, cls: "text-violet-400",  label: "Heading"   },
  text:      { icon: AlignLeft, cls: "text-zinc-400",   label: "Text"      },
  table:     { icon: Table2,   cls: "text-blue-400",    label: "Table"     },
  image:     { icon: Image,    cls: "text-amber-400",   label: "Image"     },
  code:      { icon: Code2,    cls: "text-emerald-400", label: "Code"      },
  formula:   { icon: Sigma,    cls: "text-pink-400",    label: "Formula"   },
  list_item: { icon: List,     cls: "text-zinc-400",    label: "List"      },
};

const ALL_TYPES = Object.keys(CHUNK_META);

function ChunkPreview({ chunk }) {
  if (chunk.type === "image") {
    return chunk.content ? (
      <img
        src={chunk.content}
        alt={chunk.metadata?.caption || "figure"}
        className="mt-2 max-h-32 rounded border border-zinc-700 object-contain"
      />
    ) : (
      <span className="text-xs text-zinc-600 italic">No image URL</span>
    );
  }
  const plain = chunk.content
    .replace(/^#+\s+/, "")
    .replace(/```[\s\S]*?```/g, "[code block]")
    .replace(/\$\$[\s\S]*?\$\$/g, "[formula]")
    .replace(/[|][-| ]+[|]/g, "")
    .slice(0, 320);
  return (
    <p
      className="mt-1.5 text-xs leading-relaxed text-zinc-400 line-clamp-4"
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(plain, { ALLOWED_TAGS: [] }) }}
    />
  );
}

export default function DocumentExplorer({ chunks }) {
  const [query, setQuery] = useState("");
  const [activeTypes, setActiveTypes] = useState(new Set(ALL_TYPES));
  const { toggleChunk, isInCart } = useCartStore();

  function toggleType(type) {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type) && next.size > 1) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return chunks.filter((c) => {
      if (!activeTypes.has(c.type)) return false;
      if (!q) return true;
      return c.content.toLowerCase().includes(q) || (c.metadata?.caption || "").toLowerCase().includes(q);
    });
  }, [chunks, activeTypes, query]);

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-zinc-800 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Source Explorer</p>
        <p className="mt-0.5 text-xs text-zinc-600">{chunks.length} chunks · {filtered.length} shown</p>

        <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-1.5">
          <Search className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter chunks…"
            className="flex-1 bg-transparent text-xs text-zinc-200 placeholder-zinc-600 outline-none"
          />
        </div>

        <div className="mt-2 flex flex-wrap gap-1">
          {ALL_TYPES.map((type) => {
            const { icon: Icon, cls, label } = CHUNK_META[type];
            const active = activeTypes.has(type);
            return (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-colors ${
                  active ? "bg-zinc-700 text-zinc-200" : "bg-zinc-800 text-zinc-600"
                }`}
              >
                <Icon className={`h-3 w-3 ${active ? cls : "text-zinc-600"}`} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {filtered.length === 0 && (
          <p className="px-1 text-xs text-zinc-600">No chunks match your filters.</p>
        )}
        {filtered.map((chunk) => {
          const inCart = isInCart(chunk.id);
          const { icon: Icon, cls } = CHUNK_META[chunk.type] || CHUNK_META.text;
          return (
            <div
              key={chunk.id}
              className={`rounded-lg border px-3 py-2.5 transition-colors ${
                inCart
                  ? "border-emerald-700/60 bg-emerald-950/20"
                  : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                  <Icon className={`h-3.5 w-3.5 ${cls}`} />
                  {CHUNK_META[chunk.type]?.label || chunk.type}
                </span>
                <button
                  onClick={() => toggleChunk(chunk)}
                  className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
                    inCart
                      ? "bg-emerald-900/50 text-emerald-300 hover:bg-red-900/40 hover:text-red-300"
                      : "bg-zinc-700 text-zinc-300 hover:bg-emerald-800/60 hover:text-emerald-300"
                  }`}
                >
                  {inCart ? <><Minus className="h-3 w-3" /> Remove</> : <><Plus className="h-3 w-3" /> Add</>}
                </button>
              </div>
              <ChunkPreview chunk={chunk} />
            </div>
          );
        })}
      </div>
    </div>
  );
}