# House Water Tracker

Mobile-first React Router app to track water meter readings, estimate monthly cost, compare against bi-annual bills, and import historical data from Google Sheets CSV.

## Stack

- React Router v7 (full-stack loaders/actions)
- TypeScript
- Tailwind CSS v4
- shadcn-style local UI components (`app/components/ui`)
- SQLite (`better-sqlite3`) + Drizzle ORM
- Recharts for dashboard visualization
- pnpm package manager

## Features

- Quick reading entry with defaults:
  - Date auto-filled to today
  - Meter index pre-filled with previous reading
- Monthly dashboard:
  - Consumption trend
  - Estimated monthly cost using latest bill effective rate
- Bi-annual bill capture and reconciliation:
  - Tracked vs official volume and price deltas
- CSV import for historical readings:
  - Robust parsing (quoted values, separators, date formats)
  - Skip duplicate dates
  - Import summary (imported/skipped/rejected)

## Getting Started

```bash
pnpm install
pnpm dev
```

App runs at `http://localhost:5173`.

## Scripts

```bash
pnpm dev
pnpm test
pnpm typecheck
pnpm build
pnpm db:generate
pnpm db:studio
pnpm backup:create
```

## Database

The app uses `DATABASE_PATH` when provided; default is `data/water.sqlite`.

On startup, Drizzle migrations from `drizzle/` run automatically.

## Security Hardening Included

- Same-origin enforcement on mutating form actions
- Basic per-IP rate limiting on write endpoints
- Security response headers on root document (CSP, frame denial, nosniff, etc.)

## Fly.io First Release

### 1) Create app and volume

```bash
flyctl apps create water-data
flyctl volumes create water_data --size 1 --region cdg
```

### 2) Deploy

```bash
flyctl deploy
```

`fly.toml` includes:
- mount at `/data`
- `DATABASE_PATH=/data/water.sqlite`
- HTTP health check on `/healthz`

### 3) Verify

```bash
flyctl status
flyctl checks list
flyctl logs
```

## Backups

Create a local backup file from the active SQLite DB:

```bash
pnpm backup:create
```

For production, run this inside a Fly machine and copy backups out periodically:

```bash
flyctl ssh console
node scripts/backup.mjs
```

Then download backup artifacts from the machine/volume to external storage.

## Routes

- `/healthz` health endpoint
- `/entry` quick meter entry
- `/dashboard` monthly chart + KPIs
- `/bills` bill entry + comparison
- `/import` CSV importer
