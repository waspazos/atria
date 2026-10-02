@AGENTS.md

# Atria

Read `docs/BRIEF.md` first; it is the source of truth for the product. Keep it updated as decisions change.

- `src/lib/domain/` — types, deal stage machine, timeline-driven state (pure, unit-tested)
- `src/lib/seed/fixture.ts` — fictional, shareable demo data (Lumen Interactive · Arcadia, Summer Creator Package; never real client data); `npm run seed:gen` regenerates `supabase/seed.sql`
- `src/lib/data/` — server-only data access; buyer links are resolved with the service role and only buyer-safe data is returned
- `src/components/client-space/` — buyer-facing deal space (built from Claude Design "Client Space v7")
- `src/app/page.tsx` + `src/components/site/` — marketing site (built from "Atria.dc.html")
- `src/lib/chat/answer.ts` — interim retrieval answerer for "Ask about this deal"; build step 8 swaps in Claude, same response shape
- `supabase/migrations/` — schema + RLS. No anon policies: buyers never query the DB directly.

Checks: `npm run typecheck && npm run lint && npm test && npm run build`.
Without Supabase env vars the app runs on the fixture; demo link `/s/demo-arcadia-summer`.
