import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText, Loader2, Trash2, Upload, AlertCircle, CheckCircle2, ChevronRight,
} from "lucide-react";
import { listDocuments, uploadDocument, deleteDocument, getErrorMessage } from "../utils/api.js";

const STATUS_STYLES = {
  ready:      { icon: CheckCircle2, cls: "text-emerald-400" },
  processing: { icon: Loader2,      cls: "text-amber-400 animate-spin" },
  failed:     { icon: AlertCircle,  cls: "text-red-400" },
};

export default function DocumentsPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setDocuments(await listDocuments());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  async function handleFile(file) {
    if (!file) return;
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (![".pdf", ".docx"].includes(ext)) {
      setError("Only .pdf and .docx files are supported.");
      return;
    }
    setError("");
    setUploading(true);
    setUploadProgress(0);
    try {
      const { document } = await uploadDocument(file, setUploadProgress);
      setDocuments((prev) => [document, ...prev]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(id, e) {
    e.stopPropagation();
    try {
      await deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-100">Documents</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Upload a PDF or DOCX. It will be decomposed into text, tables, images, and code blocks
        you can pick from in the Workspace.
      </p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]); }}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`mt-6 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
          dragOver
            ? "border-emerald-400 bg-emerald-950/20"
            : "border-zinc-700 bg-zinc-900 hover:border-zinc-500"
        }`}
      >
        {uploading ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
            <p className="text-sm text-zinc-300">
              Uploading &amp; parsing{uploadProgress > 0 ? ` — ${uploadProgress}%` : "…"}
            </p>
            <p className="text-xs text-zinc-500">Large PDFs with OCR may take a minute or two.</p>
          </>
        ) : (
          <>
            <Upload className="h-6 w-6 text-zinc-500" />
            <p className="text-sm text-zinc-300">
              Drop a <span className="text-zinc-100">PDF</span> or{" "}
              <span className="text-zinc-100">DOCX</span> here, or click to browse
            </p>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
          <button className="ml-auto hover:text-red-200" onClick={() => setError("")}>✕</button>
        </div>
      )}

      <div className="mt-8">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading documents…
          </div>
        ) : documents.length === 0 ? (
          <p className="text-sm text-zinc-500">No documents yet. Upload one above.</p>
        ) : (
          <ul className="divide-y divide-zinc-800 overflow-hidden rounded-xl border border-zinc-800">
            {documents.map((doc) => {
              const s = STATUS_STYLES[doc.status] || STATUS_STYLES.processing;
              const StatusIcon = s.icon;
              const clickable = doc.status === "ready";
              return (
                <li
                  key={doc.id}
                  onClick={() => clickable && navigate(`/workspace/${doc.id}`)}
                  className={`group flex items-center justify-between gap-4 bg-zinc-900 px-4 py-3.5 transition-colors ${
                    clickable ? "cursor-pointer hover:bg-zinc-800" : "cursor-default opacity-70"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <FileText className="h-4 w-4 shrink-0 text-zinc-500" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-200">{doc.filename}</p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {doc.source_type.toUpperCase()} · {doc.asset_count} image{doc.asset_count !== 1 ? "s" : ""} ·{" "}
                        {new Date(doc.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="flex items-center gap-1.5 text-xs">
                      <StatusIcon className={`h-3.5 w-3.5 ${s.cls}`} />
                      <span className="capitalize text-zinc-400">{doc.status}</span>
                    </span>
                    <button
                      onClick={(e) => handleDelete(doc.id, e)}
                      className="rounded-md p-1.5 text-zinc-600 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-950/40 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    {clickable && <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400" />}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}