import { useState } from "react";
import { X, Loader2, CheckCircle2, AlertCircle, Copy, ExternalLink } from "lucide-react";
import { useCartStore } from "../store/useCartStore.js";
import { savePromptVersion, getErrorMessage } from "../utils/api.js";

export default function PromptSaver({ onClose }) {
  const { items, instructions, namespace, title, description,
          setNamespace, setTitle, setDescription } = useCartStore();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(null);
  const [copied, setCopied] = useState(false);

  async function handleSave() {
    if (!namespace.trim()) { setError("Namespace is required."); return; }
    if (items.length === 0) { setError("Add at least one chunk to the cart before saving."); return; }
    setError("");
    setSaving(true);
    try {
      const result = await savePromptVersion({
        namespace: namespace.trim(),
        title: title.trim() || undefined,
        description: description.trim() || undefined,
        instructions,
        cartItems: items.map((item) => ({ chunk_id: item.chunk_id, order: item.order })),
      });
      setSaved({ uri: result.uri, version: result.version.version });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function copyUri() {
    await navigator.clipboard.writeText(saved.uri);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-end bg-black/50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex h-full w-full max-w-md flex-col border-l border-zinc-800 bg-zinc-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Save to Registry</h2>
            <p className="mt-0.5 text-xs text-zinc-500">Creates an immutable version accessible via the MCP bridge.</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Namespace <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={namespace}
              onChange={(e) => setNamespace(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))}
              placeholder="e.g. api-docs"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-emerald-600 transition-colors font-mono"
            />
            <p className="mt-1 text-xs text-zinc-600">
              Becomes <span className="font-mono text-zinc-400">kurate://{namespace || "your-namespace"}-v1</span>
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Title <span className="text-zinc-600">(optional)</span></label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Payment API Reference"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-emerald-600 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Description <span className="text-zinc-600">(optional)</span></label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What is this context curated for?"
              className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-emerald-600 transition-colors"
            />
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 space-y-1.5">
            <p className="text-xs font-medium text-zinc-400">What will be saved</p>
            <div className="flex justify-between text-xs text-zinc-500">
              <span>Cart items</span><span className="text-zinc-300">{items.length}</span>
            </div>
            <div className="flex justify-between text-xs text-zinc-500">
              <span>Instructions</span>
              <span className="text-zinc-300">{instructions.trim() ? `${instructions.trim().length} chars` : "None"}</span>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0" />{error}
            </div>
          )}

          {saved && (
            <div className="rounded-lg border border-emerald-800/50 bg-emerald-950/20 px-4 py-4 space-y-3">
              <div className="flex items-center gap-2 text-sm text-emerald-300">
                <CheckCircle2 className="h-4 w-4" /> Saved as version {saved.version}
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 min-w-0 truncate rounded bg-zinc-800 px-2 py-1.5 text-xs font-mono text-zinc-300">
                  {saved.uri}
                </code>
                <button
                  onClick={copyUri}
                  className="shrink-0 rounded-md border border-zinc-700 p-1.5 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                >
                  {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
              <p className="text-xs text-zinc-500">
                Reference this URI from Claude Desktop, Cursor, or Windsurf via the Kurate MCP server.
              </p>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-zinc-800 px-5 py-4 flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-zinc-700 py-2 text-sm text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors"
          >
            {saved ? "Close" : "Cancel"}
          </button>
          {!saved && (
            <button
              onClick={handleSave}
              disabled={saving || items.length === 0}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</> : "Save version"}
            </button>
          )}
          {saved && (
            <a
              href={`http://localhost:4000/api/v1/prompts/${namespace}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300"
            >
              View in API <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}