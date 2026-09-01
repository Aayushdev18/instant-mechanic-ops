# Instant Mechanic — Live Ops Dashboard

2-day Internshala assignment.

Ops dashboard for vehicle service bookings: KPIs, charts, bookings table, mechanics, customers. Live status updates locally (no full page reload).

**Stack:** Next.js + TypeScript + Tailwind (frontend) · Express + Prisma + SQLite (backend) · SSE / WebSocket for live updates

```
Browser → Next.js :43123 → Express :43124 → SQLite
```

## Run

Need Node 22. Two terminals:

```bash
cd backend
cp .env.example .env
npm install
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
```

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

App: http://127.0.0.1:43123  
API: http://127.0.0.1:43124/api/health  

Seed: 560 bookings, 60 customers, 24 mechanics.

Env: backend `PORT`, `DATABASE_URL`, `CORS_ORIGIN`. Frontend: leave `NEXT_PUBLIC_API_URL` empty.

## APIs

`GET /api/dashboard` · `GET /api/bookings` · `GET /api/bookings/:id` · `PATCH /api/bookings/:id/status` · `GET /api/mechanics` · `GET /api/customers` · `GET /api/events`

## Deploy / AI

GitHub: https://github.com/Aayushdev18/instant-mechanic-ops  

Vercel for the UI demo. AWS backend skipped (time). Used Cursor for scaffolding; I can explain the schema, filters, and live updates.

Skipped: login, maps, Postgres on AWS.
