# Temporary.

> Remember things you don't want to remember forever.

Most notes apps ask one question: **"do you want to save this?"** Say yes, and it sits there forever — a parking spot from three months ago, a Wi-Fi password for a place you've long since checked out of, a locker code for a locker you no longer have. Nothing is lost, but everything is buried under everything else.

Temporary asks a different question: **"how long do you need this?"**

You capture something, give it a lifespan, and it's there exactly as long as it's useful — then it's gone. Not archived, not hidden behind a filter. Deleted, from your device and from the database, the moment it expires.

```
capture → remember → expire → forget
```

## Why this instead of a notes app

- **A notes app is a permanent archive by default.** Temporary is temporary by default — you have to actively extend something for it to outlive its original expiry.
- **Nothing to clean up.** There's no "someday I'll go through my notes" task, because expired memories don't wait around to be deleted — they're already gone.
- **The expiry is the point, not a feature bolted onto notes.** Every memory has an expiry timestamp as a first-class field, not an optional reminder.
- **You get warned before you forget.** A notification fires shortly before expiry ("forgetting in 12 min") and again when it's actually gone, so nothing disappears without warning.

## What it actually does

- Capture a memory with one line of text and a duration — `30 min`, `2 hours`, `tonight`, `tomorrow`, `3 days`, or a custom date/time.
- See what's still relevant, sorted by how soon it disappears, with a live countdown.
- Edit, extend, or delete anything before it expires.
- Search across active memories.
- Get a heads-up notification before something is forgotten, and a final one when it's gone.
- Two themes — dark, and a "luxury light" mode, not the washed-out kind.
- Everything syncs across web and mobile through the same backend and account.

## How the "forget" part actually works

A background sweep on the server checks every memory's expiry timestamp on a fixed interval (and opportunistically on every read). Anything past its expiry is **hard-deleted** from Postgres — not soft-deleted, not flagged, not moved to an archive table. Once it's gone, querying for it returns nothing, because there's nothing left to return. The mobile app mirrors this by canceling any pending local notification the moment its memory disappears.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 19 · TypeScript · Vite · Tailwind |
| Mobile | React Native (Expo SDK 57) · React Navigation |
| Backend | Node · TypeScript · Fastify · Prisma |
| Database | PostgreSQL |
| Auth | Supabase Auth (email/password) |
| Hosting | Railway (backend + Postgres) |

## Repo layout

```
apps/backend    Fastify API, Prisma schema + migrations, expiry sweep
apps/frontend   React web app (/, /login, /signup, /app)
mobile          Expo (React Native) app — Android & iOS, same backend + Supabase
packages/shared Types, expiry parsing, formatting — shared by every client
```

## API

```
GET    /api/auth/me                DELETE /api/auth/me
GET    /api/memories                POST   /api/memories
GET    /api/memories/:id            PATCH  /api/memories/:id
DELETE /api/memories/:id            POST   /api/memories/:id/extend
GET    /api/health
```

Identity (signup/login/logout/profile edits) is handled client-side directly against Supabase Auth. The backend verifies the resulting bearer token on every request and is the only thing that can permanently delete an account — that needs Supabase's service-role key, which no client ever holds. Every memory route is ownership-checked server-side: a request for a memory you don't own returns 404, not 403, so existence itself isn't leaked.

## Running it locally

```bash
docker compose up -d          # Postgres on localhost:5433
npm install
npm run prisma:deploy         # apply migrations
npm run dev                   # backend :3001 + frontend :5173
```

Copy `apps/backend/.env.example` → `.env` and `apps/frontend/.env.example` → `.env`, then fill in a Supabase project's URL and anon key.

Open http://localhost:5173.

### Mobile

```bash
cd mobile
cp .env.example .env   # Supabase URL/key + your backend URL (LAN IP for local, or a deployed URL)
npm run start
```

Scan the QR code with **Expo Go** (same network as this machine) for local dev. `EXPO_PUBLIC_API_BASE_URL` must be reachable from the phone — `localhost` on a phone means the phone itself, not this machine.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Backend + frontend concurrently |
| `npm run dev:api` / `npm run dev:web` | One or the other |
| `npm run dev:mobile` | Expo dev server |
| `npm run build` | Typecheck + build backend and frontend |
| `npm run typecheck` | TypeScript across every workspace |
| `npm run prisma:deploy` | Apply Prisma migrations |
| `npm run prisma:studio` | Browse the database |
