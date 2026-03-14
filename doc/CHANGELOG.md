# CHANGELOG

## 2026-03-14
- Added project planning documents under /plans.
- Added Next.js app scaffolding and Supabase migration skeleton.
- Added Supabase GitHub setup guide and UI reference guide.
- Added Supabase SSR auth wiring and middleware; build verified.
- Added /doc context-management files as per AGENTS.md.
- Added protected dashboard layout and sign-out server action; upgraded dashboard UI shell and page placeholders.
- Added full LIS backend migration draft (20260314_002_lis_core.sql) with RLS and indexing.
- Added admin Supabase client and /api/health/db endpoint for backend verification.
- Backend verification complete: /api/health/db 200, login route 200, protected overview route redirects (307).
- UI refresh: blue-white interactive theme, redesigned landing + login + dashboard shell + enhanced overview panels.
- Added real Patients module endpoints/UI and dev seed endpoint; added DB bootstrap SQL + migration rerun guide.
- Patients module now uses real Supabase data (API + UI + seed endpoint); inserted initial real patient records.
- Added tests catalog + order creation modules with real Supabase CRUD and modernized teal dashboard UI theme.
- UI redesign pass aligned to provided screenshots: blue/white enterprise layout, left sticky icon navigation, compact top search bar, and grid-first content blocks.
- Added /api/samples and /api/results with full service layer and dashboard UI consoles; order creation now auto-creates sample barcodes.
- Added /api/reports and /api/billing + UI consoles; report release now updates order/item statuses and creates report version rows.
- Added lib/reports/pdf.ts and /api/reports/download endpoint; report releases now create actual PDF files in Supabase Storage bucket 'reports'.
- Auth upgraded: added /signup + /login email/password flow and automatic profiles row creation (tenant_admin for first user, receptionist for next users).
