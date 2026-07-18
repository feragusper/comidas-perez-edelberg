# Comidas Perez-Edelberg

A private weekly **meal planner** for a family of three. It turns the household's
rules — dinner leftovers become the next day's lunch, some meals are keto, and
there are things the small child can and can't eat — into a weekly plan, keeps a
backlog of meal ideas based on what's in the pantry, and builds the shopping list
from what's missing.

> **Closed product.** Built for the Perez-Edelberg family. Access is restricted to
> an allow-list of emails. Opening it for public use may be considered later.

🔗 **Product landing:** https://feragusper.github.io/comidas-perez-edelberg/

---

## Features

| Section | Route | What it does |
|---|---|---|
| **Weekly menu** | `/` | Plan dinner, breakfast and snack for the week, honoring the family rules. Mixes history with AI suggestions. Drag & drop reordering, week navigation. |
| **My meals** | `/mis-comidas` | Personal meal catalog: name, emoji icon, ingredients, tags (keto, etc.), sorting by usage. |
| **Don Bacilio** (pantry) | `/don-bacilio` | Track what's at home; ask the AI what to cook from it. |
| **Shopping** | `/super` | Shopping list generated from the menu, grouped by category, with checkoff and copy-to-clipboard. |
| **Reports** | `/reportes` | Usage analytics: most-used meals, keto ratio, weekly trends (charts). |
| **Auth** | `/auth` | Email/Google login (allow-list gated). |

> `/normalizar` is a temporary internal tool used to migrate legacy meals to the
> current meals+ingredients model. It will be removed once migration is complete.

---

## Architecture

Client-side **SPA** talking to a managed **Supabase** backend. The AI runs in
Supabase **edge functions** behind the Lovable AI Gateway.

```
┌──────────────────────────────┐
│  React SPA (Vite)            │  routing · TanStack Query · UI
└──────────────┬───────────────┘
               │ supabase-js / REST
     ┌─────────┼───────────────────────────────┐
     ▼         ▼                                ▼
┌─────────┐ ┌───────────┐              ┌──────────────────┐
│ Auth    │ │ Postgres  │              │ Edge Functions    │
│ (allow- │ │ (RLS)     │              │ (Deno)            │
│ list)   │ │           │              │  → Lovable AI GW  │
└─────────┘ └───────────┘              │  → Gemini         │
                                       └──────────────────┘
```

### Data model

- **Meals are combinations of ingredients.** `meals.ingredient_ids` references
  `ingredients.ingredient_id`. An empty array means the meal is pending
  normalization.
- **`meal_plan` stores a full food snapshot per week.** Historical snapshots are
  never rewritten — they're resolved by id against the live catalog at read time.
  `kind: "ingredient"` marks a standalone ingredient in a slot; absence of `kind`
  means meal (legacy).
- **Stage vs prod share one database**, separated by key prefixes
  (`stage_`/`prod_` in `meal_plan.week_key` and `pantry.env`). `localhost` counts
  as stage.

Main tables: `meals`, `ingredients`, `custom_meals`, `meal_plan`, `pantry`,
`allowed_emails` (+ `is_allowed_user()` for access control).

### Edge functions (`supabase/functions/`)

- `suggest-meals` — meal ideas for the weekly plan
- `suggest-from-ingredients` — what to cook from the pantry
- `suggest-ingredients-for-meal` — ingredient suggestions for a meal
- `autocomplete-week` — fill a whole week from history + AI
- `generate-shopping-list` — build the shopping list from the plan

All AI calls go through the Lovable AI Gateway (`ai.gateway.lovable.dev`) using
`google/gemini-3-flash-preview`, with rate-limit and credit handling.

---

## Tech stack

- **Language:** TypeScript
- **Framework:** React 18 + Vite
- **UI:** Tailwind CSS, shadcn/ui (Radix UI), lucide-react icons
- **Data/state:** TanStack Query, React Router
- **Forms/validation:** React Hook Form + Zod
- **Charts:** Recharts
- **Drag & drop:** @hello-pangea/dnd
- **Backend:** Supabase (Postgres + RLS, Auth, Edge Functions on Deno)
- **AI:** Lovable AI Gateway → Gemini
- **Testing:** Vitest + Testing Library (jsdom)
- **Platform:** Lovable (build & continuous deploy)

---

## Project structure

```
src/
├── pages/              # Route-level screens (Index, CustomMeals, DonBacilio, …)
├── components/         # App components
│   └── ui/             # shadcn/ui primitives
├── hooks/              # Data + UI hooks (useMealPlan, useMeals, usePantry, useAuth, …)
├── integrations/
│   ├── supabase/       # client + generated types
│   └── lovable/        # Lovable auth integration
├── data/               # Static data (food taxonomy, emojis, seed meals)
├── lib/                # Utilities (env, meal-plan usage helpers)
└── test/               # Vitest setup + tests

supabase/
├── functions/          # Deno edge functions (AI)
└── migrations/         # SQL migrations

docs/                   # Product landing page (served on GitHub Pages)
.github/workflows/      # GitHub Pages deploy
```

---

## Local development

Requires **Node.js** and **npm**.

```sh
git clone https://github.com/feragusper/comidas-perez-edelberg.git
cd comidas-perez-edelberg
npm i
npm run dev          # http://localhost:8080
```

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Dev server (Vite, port 8080) |
| `npm run build` | Production build |
| `npm run build:dev` | Development-mode build |
| `npm run lint` | ESLint |
| `npm run test` | Run tests (Vitest) |
| `npm run test:watch` | Tests in watch mode |

### Environment

`.env` holds the Supabase connection (publishable/anon key only — safe to be
public; security is enforced by Row Level Security):

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PROJECT_ID=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

Google OAuth starts at `/~oauth/initiate`, an endpoint that only exists on Lovable
hosting; on localhost it's proxied to the Lovable project domain (see
`vite.config.ts`).

---

## Backend & deployment

The Supabase project is owned by **Lovable**; there is no local Supabase CLI.

- **App:** Lovable builds and deploys the SPA continuously from `main`.
- **Landing:** the static page in `docs/` is published to GitHub Pages via
  `.github/workflows/deploy-pages.yml` on every push touching `docs/`.
- **Migrations / edge functions** can't be applied locally — commit them, push,
  and ask Lovable to apply them as-is.
- Lovable also pushes commits to `main`; always
  `git pull --rebase --autostash` before pushing.

---

## Authors

- **Fernando Perez** — development · product
- **Debora Edelberg** — product · design

Built with AI assistance via Lovable.
