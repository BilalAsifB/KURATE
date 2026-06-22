# KURATE

A deterministic data pipeline and interactive UI — the **Context Cart** — for meticulously selecting, organizing, and versioning structural pieces of large documents (text, tables, images, code) into precise, low-token LLM context.

## Quickstart

```bash
cp .env.example .env
docker compose up -d --build
docker compose run --rm migrate
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:4000 |
| Parser | http://localhost:8000 |
| MinIO console | http://localhost:9001 |

Tear down: `docker compose down` (add `-v` to also drop volumes).