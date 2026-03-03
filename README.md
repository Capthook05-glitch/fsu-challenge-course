# FSU Challenge Course Facilitator Toolkit

This repository includes a **working starter app** (React + Vite + Tailwind + Supabase auth) so you can run locally and connect to Supabase right away.

## What is implemented right now

- Vite React app scaffold
- Tailwind setup with FSU brand colors
- Supabase client wiring via env vars
- Email/password sign in + sign up
- Profile loading from `profiles` table after login
- Baseline SQL migration with:
  - `profiles`, `games`, `sessions`, `session_games`, `session_feedback`
  - RLS policies for facilitator/admin access
  - auth trigger to auto-create profile rows
  - starter seed games (10 items)
- Local setup checker script (`npm run setup:check`)

---

## 1) Run the app locally

### Prerequisites
- Node.js 18+
- A Supabase project (free tier is fine)

### Install + start
```bash
npm install
cp .env.example .env
# add your real Supabase values in .env
npm run setup:check
npm run dev
```

Open: `http://localhost:5173`

---

## 2) Create and configure Supabase project

1. Go to Supabase dashboard and create a new project.
2. In **Project Settings → API**, copy:
   - Project URL
   - `anon` public key
3. Paste them into `.env`:
   ```bash
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```

---

## 3) Apply database schema + policies

In Supabase dashboard:
1. Open **SQL Editor**
2. Create a new query
3. Paste `supabase/migrations/001_init.sql`
4. Run it

This creates all baseline tables, policies, profile trigger, and starter games.

---

## 4) First admin user setup (important)

New signups default to `facilitator`. To promote yourself to admin, run this SQL after you sign up:

```sql
update public.profiles
set role = 'admin'
where email = 'you@example.com';
```

Refresh the app to load updated role data.

---

## 5) Fast setup validation command

Run this before `npm run dev`:

```bash
npm run setup:check
```

It checks:
- `.env` exists
- `VITE_SUPABASE_URL` has been replaced from placeholder
- `VITE_SUPABASE_ANON_KEY` has been replaced from placeholder
- Migration file exists

---

## 6) Why this structure works well

- Keeps security in Supabase (RLS), not only in frontend logic
- Gives immediate proof that auth + profile + policies are connected
- Gives a clean base to add catalog, planner, facilitation mode next

---

## 7) Next build order (recommended)

1. Catalog page (search, filters, list/grid)
2. Session planner (create session, add games, reorder)
3. Facilitation mode (timer + localStorage offline cache)
4. Admin game CRUD
5. Feedback links and exports

---

## Project structure

```txt
scripts/
  setup-check.mjs
src/
  components/
    auth/
  lib/
    supabase.js
  pages/
    AppShell.jsx
  styles/
    index.css
  App.jsx
  main.jsx
supabase/
  migrations/
    001_init.sql
```
