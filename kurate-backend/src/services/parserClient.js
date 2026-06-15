import axios from "axios";
import FormData from "form-data";

const PARSER_BASE_URL = process.env.PARSER_SERVICE_URL || "http://localhost:8000";
const PARSER_TIMEOUT_MS = Number(process.env.PARSER_TIMEOUT_MS) || 5 * 60 * 1000; // 5 min

const client = axios.create({
  baseURL: PARSER_BASE_URL,
  timeout: PARSER_TIMEOUT_MS,
});

export async function parseDocument(fileBuffer, filename, mimetype) {
  const form = new FormData();
  form.append("file", fileBuffer, { filename, contentType: mimetype });

  try {
    const { data } = await client.post("/api/v1/parse", form, {
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    return data;
  } catch (err) {
    if (err.response) {
      const detail = err.response.data?.detail || err.response.statusText;
      throw new Error(`Parser service error (${err.response.status}): ${detail}`);
    }
    if (err.code === "ECONNREFUSED" || err.code === "ECONNABORTED") {
      throw new Error(`Could not reach kurate-parser at ${PARSER_BASE_URL}: ${err.message}`);
    }
    throw err;
  }
}

export async function checkParserHealth() {
  try {
    const { data } = await client.get("/health", { timeout: 5000 });
    return data?.status === "healthy";
  } catch {
    return false;
  }
}