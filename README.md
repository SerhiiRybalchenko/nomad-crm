# Nomad — CRM for small business

A weekend vibe-coding build: a sales pipeline, follow-up reminders, and a
reporting view, replacing three spreadsheets a small business used to juggle.

- **Pipeline** — a drag-and-drop kanban board (Lead → Contacted → Proposal → Won / Lost)
- **Reminders** — a follow-up list grouped into Overdue / Today / Upcoming / Completed
- **Reports** — deals by stage, revenue over time, conversion rate, and a pipeline funnel

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + TypeScript, React Router, TanStack Query, `@dnd-kit` (drag & drop), Framer Motion, Recharts |
| Backend | Node.js + Express (TypeScript), Zod for request validation |
| Database | PostgreSQL — via **`@electric-sql/pglite`**, see note below |

## ⚠️ Local-environment substitution: embedded Postgres, not a server

This machine has no PostgreSQL server (and no Docker) installed. Rather than fake
the database layer, the backend runs **[`@electric-sql/pglite`](https://pglite.dev)**
— a real, WASM-compiled Postgres engine that runs in-process. It speaks the same
SQL, the same data types, the same query protocol shape as a normal Postgres
server; it is simply embedded rather than a separate process you connect to over
a socket. The backend talks to it with plain parameterized SQL (`db.query(sql, params)`),
exactly as it would with `pg`.

Data is persisted to `backend/pgdata/` (gitignored), so it survives restarts. On
first boot the app creates the schema and seeds realistic demo data (12 companies,
14 contacts, 30 deals across every stage, 12 reminders); on later boots it detects
existing rows and skips reseeding.

**To swap in a real Postgres server later:** the schema (`backend/src/db/schema.ts`)
is plain, portable SQL — it will run unmodified against Postgres 14+. Swap
`backend/src/db/index.ts` to construct a connection from `process.env.DATABASE_URL`
using [`pg`](https://node-postgres.com)'s `Pool` instead of `new PGlite(...)`; every
call site already uses `db.query(sql, params)` with the same row-returning shape,
so route files need no changes. Nothing here is a mock or a static fixture — it's
a genuine Postgres engine, just embedded instead of server-based, and that
substitution is isolated to one file.

## Running it locally

Two terminals — the API and the SPA are independent processes.

**Terminal 1 — API (http://localhost:4000)**
```bash
cd backend
npm install
npm run build   # compiles + typechecks
npm start       # boots the API, seeds demo data on first run
```
(or `npm run dev` for hot-reload during development)

**Terminal 2 — Frontend (http://localhost:5173)**
```bash
cd frontend
npm install
npm run dev
```
Vite proxies `/api/*` to `localhost:4000` in dev (see `vite.config.ts`), so just
open the frontend URL — no CORS setup needed.

**Production build check** (already verified clean, zero errors):
```bash
cd backend  && npm run build       # tsc -p tsconfig.json
cd frontend && npm run build       # tsc -b && vite build
```

## Project structure

```
nomad-crm/
├── backend/
│   ├── src/
│   │   ├── db/            # PGlite bootstrap, schema, demo seed data
│   │   ├── routes/        # companies, contacts, deals, reminders, reports
│   │   ├── types.ts
│   │   └── index.ts        # Express app entry
│   └── pgdata/             # embedded Postgres data files (created on first run)
└── frontend/
    └── src/
        ├── components/     # KanbanBoard, DealCard, DealModal, Toast, icons…
        ├── pages/          # PipelinePage, RemindersPage, ReportsPage
        ├── hooks/          # TanStack Query hooks (incl. optimistic drag reorder)
        ├── lib/            # api client, formatting, stage/color tokens
        └── styles/         # design tokens + per-page CSS (dark, terracotta accent)
```

## API

`GET/POST /api/deals`, `PATCH /api/deals/:id`, `PATCH /api/deals/reorder/batch`
(batched stage/position updates after a board drag), `DELETE /api/deals/:id`,
`GET/POST/PATCH/DELETE /api/reminders`, `GET /api/companies`, `GET /api/contacts`,
`GET /api/reports/summary` (stage breakdown, 6-month revenue, conversion rate).

## Design notes

Dark, warm "desert-wanderer" identity (terracotta/amber accent, Space Grotesk +
Inter, no default purple-gradient AI look) with a validated colorblind-safe
5-color stage palette, animated page/section transitions, optimistic
drag-and-drop with rollback on failure, skeleton loading states, and empty
states for a from-scratch workspace.

## Caveats

- **No standalone Postgres server on this machine** — `@electric-sql/pglite`
  (embedded WASM Postgres) stands in for it, as described above. Swapping to a
  real server is a one-file change once `DATABASE_URL` is available.
- Auth, multi-user access, and email/SMS reminder delivery are out of scope for
  this weekend build — it's a single-workspace demo.
