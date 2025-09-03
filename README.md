# Maintenance Tickets Boilerplate (Next.js App Router)

Mobile‑first UI for listing and tracking maintenance tickets with a basic dashboard.

## Quick Start

```bash
# 1) Install deps
npm install

# 2) Copy env
cp .env.local.example .env.local

# 3) Run (expects your API at NEXT_PUBLIC_API_BASE)
npm run dev
# http://localhost:3000
```

## Pages
- `/tickets` — tabs for **NEW**, **IN_PROGRESS**, **DONE**
- `/dashboard` — KPIs + priority distribution + latest NEW

## API expected
GET {NEXT_PUBLIC_API_BASE}/api/v1/tickets?status=NEW|IN_PROGRESS|DONE&limit=20&sortBy=createdAt&sortDir=desc
