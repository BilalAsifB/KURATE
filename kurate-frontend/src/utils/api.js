import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5 * 60 * 1000,
});

export async function uploadDocument(file, onProgress) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post("/documents", form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) onProgress(Math.round((evt.loaded / evt.total) * 100));
    },
  });
  return data;
}

export async function listDocuments() {
  const { data } = await api.get("/documents");
  return data.documents;
}

export async function getDocument(documentId) {
  const { data } = await api.get(`/documents/${documentId}`);
  return data;
}

export async function deleteDocument(documentId) {
  await api.delete(`/documents/${documentId}`);
}

export async function savePromptVersion({ namespace, title, description, instructions, cartItems }) {
  const { data } = await api.post("/prompts", {
    namespace, title, description, instructions,
    cart_items: cartItems,
  });
  return data;
}

export async function listPrompts() {
  const { data } = await api.get("/prompts");
  return data.prompts;
}

export async function listPromptVersions(namespace) {
  const { data } = await api.get(`/prompts/${namespace}/versions`);
  return data;
}

export async function getPrompt(namespace, version) {
  const { data } = await api.get(`/prompts/${namespace}`, {
    params: version ? { version } : undefined,
  });
  return data;
}

export async function checkParserHealth() {
  try {
    const { data } = await api.get("/health/parser");
    return data.parser === "healthy";
  } catch { return false; }
}

export function getErrorMessage(err) {
  return (
    err?.response?.data?.error ||
    err?.response?.data?.detail ||
    err?.message ||
    "Something went wrong."
  );
}