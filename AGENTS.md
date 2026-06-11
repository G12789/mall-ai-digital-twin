# AGENTS.md

Guidance for AI coding agents (Cursor, Claude Code, Codex, Copilot) working in this repo.

## What this project is
A multi-tenant **digital-twin + AI management platform for shopping malls**. Frontend is React 19 + Vite + three.js; backend is Supabase (Postgres/pgvector, Auth, Storage, Edge Functions).

## Setup
```bash
cd frontend
npm install
cp .env.example .env   # fill in your own Supabase + LLM keys; never commit real keys
npm run dev            # Vite dev server
npm run build          # tsc -b && vite build
npm run lint           # eslint
```

## Project layout
- `frontend/` — React SPA. Feature-first structure under `src/features/*` (twin, copilot, editor, knowledge) and `src/pages/*`.
- `supabase/migrations/` — SQL schema (core, operations, RLS policies, seed).
- `supabase/functions/` — Edge Functions: `copilot-chat`, `rag-query`, `sql-execute`.
- `ai-pipeline/` — Python scripts to chunk + embed documents for RAG.
- `blender/` — extrude floor plans (GeoJSON) into glTF.

## Conventions
- TypeScript everywhere in `frontend`. State via Zustand stores (`src/features/*/store`).
- UI uses Ant Design 6; 3D uses `@react-three/fiber` + `@react-three/drei`.
- Multi-tenant: every data access is scoped by `tenant_id` with Postgres RLS. Do not write queries that bypass RLS.
- The Copilot must only run **read-only, pre-compiled SQL templates** (`src/features/copilot/services/sqlTemplates.ts`) — never let the LLM emit raw SQL.

## Secrets
- All secrets live in `frontend/.env` (gitignored). The template is `.env.example`.
- Never hardcode API keys in source. Never commit `.env`.

## Don't
- Don't add network calls that send tenant data to third parties beyond the configured LLM endpoint.
- Don't commit `node_modules/`, `dist/`, or `.env`.
