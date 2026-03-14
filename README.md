# PathologyLab Pro

Production-style pathology LIS built with:
- Next.js (App Router)
- Supabase (Postgres/Auth/Storage)
- Vercel-ready deployment

## Current Implementation Status

Implemented modules:
- Auth: email/password signup + login + middleware route protection
- RBAC: Admin, Receptionist, Sample Collection, Technician, Pathologist, Billing
- Patients: create/list/search/sort/paginate
- Tests Catalog: create/list/search/sort/paginate
- Orders: create order with multiple tests + live listing
- Samples: queue + status transitions (pending -> collected -> received)
- Results: result entry + update workflow
- Reports: release flow + versioning + downloadable PDF from Supabase Storage
- Billing: payment recording + live balances
- Dashboard: KPIs, transactions grid filters, analytics charts
- UI: themed landing, auth split screens, interactive dashboard components

## Plan Gap Review (What Is Still Pending)

Based on `/plans` + `/doc`:
- Automated tests are not implemented yet (unit/integration/E2E still pending)
- CI quality gates (lint/test in pipeline) are not fully configured
- Hardening phase items pending:
  - security verification checklist execution
  - performance/load benchmarking
  - backup/restore drill documentation
  - formal UAT sign-off scripts
- Open product/tech decisions still unresolved (from `plans/11-open-questions.md`):
  - patient portal in MVP or later
  - doctor portal phase
  - barcode format standard
  - abnormal rules configurability
  - notification provider (email/SMS)

## Local Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
- Create `.env.local`
- Add:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `OPENAI_API_KEY` (for AI assistant responses)
  - optional: `OPENAI_MODEL=gpt-4o-mini`
  - optional: `DEFAULT_TENANT_CODE=DEFAULT`

3. Run app:
```bash
npm run dev
```

4. Build check:
```bash
npm run build
```

## Database Setup / Migration

Use Supabase SQL Editor and run:
- `plans/15-db-bootstrap-v2.sql` (recommended)

If schema already exists and needs re-run:
- Follow `plans/16-migration-rerun-steps.md`

## Seed Role-Based Users

Script:
```bash
node scripts/provision-role-users.mjs
```

Default password for all seeded users:
- `Test@123`

## Role Credentials

- Admin: `admin@pathologylabpro.com`
- Receptionist: `reception@pathologylabpro.com`
- Sample Collection Staff: `collector@pathologylabpro.com`
- Lab Technician: `technician@pathologylabpro.com`
- Pathologist / Doctor: `pathologist@pathologylabpro.com`
- Billing / Accounts: `billing@pathologylabpro.com`

## Testing Checklist (Manual QA)

### Core flow (happy path)
1. Login as Receptionist
2. Create patient
3. Create order with 1+ tests
4. Login as Sample Collection Staff -> collect sample
5. Login as Technician -> receive sample + enter result
6. Login as Pathologist -> release report
7. Login as Billing -> record payment
8. Download released report

### RBAC checks
- Receptionist cannot access Admin page
- Billing cannot edit results
- Technician cannot manage users
- Pathologist can release reports, not create users

### API checks
- `GET /api/health/db`
- `GET/POST /api/patients`
- `GET/POST /api/tests`
- `GET/POST /api/orders`
- `GET/POST /api/samples`
- `GET/POST /api/results`
- `GET/POST /api/reports`
- `GET /api/reports/download?order_id=...`
- `GET/POST /api/billing`
- `GET/POST/PATCH /api/admin/users` (admin only)

### UX checks
- Grid search/filter/sort/pagination across modules
- Form validation messages visible and clear
- Full-page blocking loader while save/update actions execute
- Responsive checks (desktop + mobile)
- AI assistant chat opens from dashboard and answers using live data context

## Important Docs

- Planning pack: `plans/README.md`
- Role matrix: `plans/ROLE_ACCESS_MATRIX.md`
- Testing strategy: `plans/08-testing-qa.md`
- Progress log: `doc/PROGRESS.md`
- Task checklist: `doc/TASKS.md`
