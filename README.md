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
  - Auto-detect date + meter columns
  - Skip duplicate dates
  - Import summary (imported/skipped/rejected)

## Getting Started

```bash
pnpm install
pnpm dev
```

App runs at `http://localhost:5173`.

## Database

SQLite file is created at `data/water.sqlite` on first run.

Drizzle helpers:

```bash
pnpm db:generate
pnpm db:studio
```

## Quality Checks

```bash
pnpm typecheck
pnpm build
```

## Routes

- `/entry` quick meter entry
- `/dashboard` monthly chart + KPIs
- `/bills` bill entry + comparison
- `/import` CSV importer
