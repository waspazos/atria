# Atria

Client-facing deal spaces for media and sponsorship sales. See [docs/BRIEF.md](docs/BRIEF.md).

## Develop

```bash
npm install
cp .env.example .env.local   # optional; without Supabase the app uses fixture data
npm run dev                  # http://localhost:3000/s/demo-xbox-summer
```

Checks: `npm run typecheck && npm run lint && npm test && npm run build`

## Database

Supabase migrations live in `supabase/migrations/`. Seed data is generated from
`src/lib/seed/fixture.ts`:

```bash
npm run seed:gen   # writes supabase/seed.sql
```
