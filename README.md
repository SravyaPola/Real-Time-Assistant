# Real‑Time AI Assistant POC

Monorepo with:
- **backend/** Fastify API + WebSockets; RAG with Postgres + pgvector
- **frontend/** Vite + React demo app
- **docker-compose.yml** for DB, backend, frontend

## Quick start (local)
1. Install Docker
2. Copy `.env.example` → `.env` and fill secrets.
3. `docker compose up --build` (first run may take a while)
4. Open http://localhost:5173

## Environment
- `OPENAI_API_KEY` — your OpenAI key
- `DATABASE_URL` — e.g. `postgres://dev:dev@localhost:5432/assist`

## Notes
- STT websocket is functional but simplified. Replace with streaming Whisper/Realtime when ready.
- Embedding dimension is **1536** (for `text-embedding-3-large`). Adjust if you change models.


## What changed
- **PDF parsing** via `pdf-parse` (automatic when uploading `.pdf`)
- **STT** now calls OpenAI Whisper periodically while you speak (semi-realtime).

## Install
From the repo root (host machine):
```
docker compose up --build
# The first run will also npm install inside containers.
```
If you prefer local dev without Docker, run:
```
cd packages/backend && npm i && npm run dev
cd packages/frontend && npm i && npm run dev
```
Make sure Postgres with pgvector is reachable per `DATABASE_URL`.
