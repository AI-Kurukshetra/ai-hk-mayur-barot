# 09. DevOps and Vercel Runbook

## Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `APP_ENV`
- `REPORT_SIGNING_SECRET`

## Deployment Model
- Branch -> Vercel Preview deployment.
- `main` -> production deployment (protected).
- Supabase migrations applied through CI job before app promote.

## CI Pipeline (Target)
1. Install dependencies and cache.
2. Lint + typecheck.
3. Unit/integration tests.
4. Build Next.js app.
5. Run migration check against staging.
6. Deploy preview/prod based on branch.

## Operational Runbooks
- Incident triage: app logs, Supabase logs, recent deploy diff.
- Rollback: redeploy prior Vercel build + rollback migration strategy if required.
- Backup cadence: daily DB backup and periodic restore validation.

## Release Checklist
- All environment variables present.
- Migration IDs verified.
- Feature flags configured.
- Smoke tests pass on deployed URL.
