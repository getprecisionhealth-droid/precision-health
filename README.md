# Precision Health

A professional fitness & health coaching platform for personal trainers — built with Next.js 16, Supabase, and Tailwind CSS.

![Stack](https://img.shields.io/badge/Next.js-16-black) ![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-4-38BDF8)

---

## Features

- **Trainer Auth** — Email/password signup with role-based access (Supabase Auth)
- **Client Management** — Add, view, filter, and archive clients
- **Health Metrics** — Log weight, body fat, BP, sleep, hydration + trend charts (Recharts)
- **Workout Plan Builder** — Multi-step builder with day-by-day exercise scheduling
- **Goal Tracking** — Set measurable goals with progress bars per client
- **Notes** — Private trainer notes per client, categorized
- **Dashboard** — High-level overview with stats and recent activity
- **Settings** — Trainer profile, certifications, specializations

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| UI Components | Radix UI primitives (custom-styled) |
| Backend | Supabase (PostgreSQL + Auth + RLS) |
| Data Fetching | TanStack React Query v5 |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Hosting | Vercel |

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/precision-health.git
cd precision-health
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create your Supabase project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Copy your **Project URL** and **Anon Key** from `Project Settings > API`

### 4. Set up environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5. Run the database migrations

Go to your **Supabase Dashboard → SQL Editor** and run each SQL block from the schema file in order:

```
database/schema.sql
```

Or paste the blocks directly from the original schema specification.

### 6. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/dashboard` (then to `/login` since you're not authenticated).

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/               # Login, Signup pages
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/          # Protected app pages
│   │   ├── dashboard/        # Overview + stats
│   │   ├── clients/          # Client list + detail
│   │   │   └── [id]/
│   │   ├── workouts/         # Plan list, builder, editor
│   │   │   ├── new/
│   │   │   └── [id]/
│   │   ├── health/           # Health metrics overview
│   │   ├── goals/            # Goals across all clients
│   │   ├── notes/            # Private trainer notes
│   │   └── settings/         # Trainer profile
│   ├── api/auth/callback/    # Supabase OAuth callback
│   └── layout.tsx            # Root layout
├── components/
│   ├── ui/                   # Design system primitives
│   ├── layout/               # Sidebar, PageHeader
│   ├── clients/              # AddClientDialog
│   ├── health-metrics/       # HealthChart, LogHealthDialog
│   ├── goals/                # AddGoalDialog
│   └── workouts/             # ExercisePicker
├── hooks/
│   └── use-data.ts           # All React Query hooks
├── lib/
│   ├── supabase/
│   │   ├── client.ts         # Browser Supabase client
│   │   └── server.ts         # RSC/API Supabase client
│   ├── utils.ts              # Helpers, formatters, cn()
│   └── validations.ts        # Zod schemas for all forms
├── providers/
│   └── query-provider.tsx    # React Query setup
├── types/
│   └── database.ts           # TypeScript types for all tables
└── middleware.ts             # Auth route protection
```

---

## Deploying to Vercel

### One-click deploy

```bash
npm i -g vercel
vercel
```

Follow the prompts. When asked about environment variables, add:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Or set them in the Vercel dashboard under `Project > Settings > Environment Variables`.

---

## Pushing to GitHub

```bash
# From the project root
git init
git add .
git commit -m "feat: initial Precision Health scaffold"

# Create a new repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/precision-health.git
git branch -M main
git push -u origin main
```

---

## Database Schema

See the full schema with RLS policies in the original specification. Key tables:

- `profiles` — extends Supabase Auth users
- `trainer_clients` — trainer ↔ client mapping
- `exercises` — global + custom exercise library
- `workout_plans` + `workout_plan_exercises` — plan templates
- `workout_logs` + `workout_log_sets` — logged sessions
- `health_metrics` — daily biometric logs
- `goals` — measurable client goals
- `notes` — private trainer notes

---

## Roadmap

- [ ] Client-facing portal (client login + self-logging)
- [ ] Stripe billing integration (SaaS subscriptions)
- [ ] Workout session logging with timer
- [ ] Nutrition / meal plan tracking
- [ ] Push notifications / check-in reminders
- [ ] PDF progress reports
- [ ] Mobile app (React Native / Expo)

---

## License

MIT
