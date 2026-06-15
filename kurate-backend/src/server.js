import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import apiRoutes from "./routes/api.js";
import mcpRoutes from "./routes/mcp.js";

const app = express();

const PORT = Number(process.env.PORT) || 4000;
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: ALLOWED_ORIGINS,
    credentials: true,
  })
);

app.use(express.json({ limit: "2mb" }));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: Number(process.env.RATE_LIMIT_PER_MINUTE) || 120,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use("/api/v1", apiRoutes);
app.use("/mcp", mcpRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "healthy", service: "kurate-backend" });
});

app.use((req, res) => {
  res.status(404).json({ error: "Not found." });
});

app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: err.message || "Internal server error." });
});

app.listen(PORT, () => {
  console.log(`kurate-backend listening on port ${PORT}`);
});

export default app;