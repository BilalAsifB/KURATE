import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, AlertCircle, ChevronLeft } from "lucide-react";
import { getDocument, getErrorMessage } from "../utils/api.js";
import { useCartStore } from "../store/useCartStore.js";
import DocumentExplorer from "../components/DocumentExplorer.jsx";
import ContextCart from "../components/ContextCart.jsx";
import PromptSaver from "../components/PromptSaver.jsx";

export default function WorkspacePage() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [chunks, setChunks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [savePanel, setSavePanel] = useState(false);
  const clear = useCartStore((s) => s.clear);

  const load = useCallback(async (id) => {
    setLoading(true);
    setError("");
    try {
      const data = await getDocument(id);
      setDocument(data.document);
      setChunks(data.chunks);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (documentId) load(documentId);
    else { setDocument(null); setChunks([]); }
    return () => clear();
  }, [documentId, load, clear]);

  if (!documentId) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-zinc-500">
        Select a document from{" "}
        <button className="mx-1 text-emerald-400 hover:underline" onClick={() => navigate("/")}>
          Documents
        </button>{" "}
        to open the Workspace.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-zinc-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading document…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <div className="flex items-center gap-2 text-sm text-red-300">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
        <button className="text-xs text-zinc-500 hover:text-zinc-300" onClick={() => navigate("/")}>
          ← Back to documents
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Docs
          </button>
          <span className="text-zinc-700">/</span>
          <span className="truncate text-sm text-zinc-300">{document?.filename || "…"}</span>
        </div>
        <button
          onClick={() => setSavePanel(true)}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 active:bg-emerald-700"
        >
          Save to registry
        </button>
      </div>

      <div className="flex flex-1 min-h-0 divide-x divide-zinc-800">
        <div className="flex w-1/2 min-w-0 flex-col">
          <DocumentExplorer chunks={chunks} />
        </div>
        <div className="flex w-1/2 min-w-0 flex-col">
          <ContextCart />
        </div>
      </div>

      {savePanel && <PromptSaver onClose={() => setSavePanel(false)} />}
    </div>
  );
}