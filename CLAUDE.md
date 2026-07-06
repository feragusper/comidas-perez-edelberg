# CLAUDE.md

Guidance for AI agents working on this repo.

## Commits

- **Always write commit messages in English**, regardless of the language used in the conversation or in the UI copy (which is Spanish).
- Lovable also pushes commits to `main`; always `git pull --rebase --autostash` before pushing.

## Backend (Supabase via Lovable)

- The Supabase project is owned by Lovable. There is no local supabase CLI and the local `.env` only has the publishable key.
- New migrations or edge functions cannot be applied/deployed locally: commit them to the repo, push, and the owner asks Lovable in its chat to apply them as-is.
- Stage and prod share the same database, separated by key prefixes (`stage_`/`prod_` in `meal_plan.week_key` and `pantry.env`). localhost counts as stage.

## Data model notes

- Meals are combinations of ingredients: `meals.ingredient_ids` references `ingredients.ingredient_id`. An empty array means the meal is pending normalization (see `/normalizar`, temporary page).
- `meal_plan` stores full food snapshots per week. Historical snapshots are never rewritten; they are resolved by id against the live catalog at read time. `kind: "ingredient"` marks a standalone ingredient in a slot; absence of `kind` means meal (legacy).
