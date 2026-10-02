@AGENTS.md

# Atria

Read `docs/BRIEF.md` first; it is the source of truth for the product. Keep it updated as decisions change.

- `src/lib/domain/` — types, deal stage machine, timeline-driven state (pure, unit-tested)
- `src/lib/seed/fixture.ts` — demo data (Microsoft · Xbox, Summer Creator Package); `npm run seed:gen` regenerates `supabase/seed.sql`
- `src/lib/data/` — server-only data access; buyer links are resolved with the service role and only buyer-safe data is returned
- `supabase/migrations/` — schema + RLS. No anon policies: buyers never query the DB directly.

Checks: `npm run typecheck && npm run lint && npm test && npm run build`.
Without Supabase env vars the app runs on the fixture; demo link `/s/demo-xbox-summer`.
