# 02. System Architecture

## Stack Decision (Forced)
- Frontend + BFF layer: `Next.js` (App Router, Server Components, Server Actions)
- Backend data/auth/storage: `Supabase`
- Hosting and deployment: `Vercel`

## Architecture Style
- Single web app with server-first data access.
- Supabase as managed backend platform.
- Domain-driven modules in Next.js (patients, orders, billing, reports, admin).

## Logical Components
- `Web UI`: role-specific dashboards and forms.
- `Next.js Server Layer`: server actions, route handlers, validation, orchestration.
- `Supabase Postgres`: transactional source of truth.
- `Supabase Auth`: users, sessions, role claims.
- `Supabase Storage`: report PDFs and attachments.
- `Observability`: Vercel logs + Supabase logs + app-level audit tables.

## Request/Data Flow
1. User authenticates via Supabase Auth.
2. Next.js server layer resolves role/tenant context.
3. Server action writes/reads from Postgres using scoped client.
4. RLS policies enforce row-level access.
5. Changes affecting workflow emit audit entries and optional realtime events.
6. Reports are generated and stored in Supabase Storage; signed URL returned.

## Tenancy Model
- Preferred: single database with `tenant_id` isolation.
- All business tables include `tenant_id` and RLS filters.
- Cross-tenant reads are denied by default.

## Environment Topology
- `local`: dev containers/tools, local env vars.
- `preview`: per-branch Vercel preview linked to staging Supabase.
- `production`: protected branch deploy, production Supabase.

## Key Risks and Mitigations
- Risk: RLS misconfiguration.
- Mitigation: policy tests + deny-by-default + explicit service-role isolation.

- Risk: Workflow complexity in one release.
- Mitigation: phase-by-phase enablement with feature flags.

- Risk: Performance on large order tables.
- Mitigation: indexed status/date fields, pagination, targeted materialized views if needed.
