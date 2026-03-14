# Backend Activation Checklist (Supabase Project bgexnkfvwpzlnsptznta)

Use this checklist to activate backend with your cloud Supabase project.

## 1) Create `.env.local`
At `D:\ai-hk-mayur-barot\.env.local`, add:

```env
NEXT_PUBLIC_SUPABASE_URL=https://bgexnkfvwpzlnsptznta.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<paste from Supabase Settings -> API>
SUPABASE_SERVICE_ROLE_KEY=<paste from Supabase Settings -> API>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 2) Apply SQL migrations in Supabase SQL Editor
Run these files in order:
1. `supabase/migrations/20260314_001_init.sql`
2. `supabase/migrations/20260314_002_lis_core.sql`

## 3) Run local app
```bash
npm run dev
```

## 4) Verify backend from browser
Open:
- `http://localhost:3000/api/health/db`

Expected success:
```json
{ "ok": true, "message": "Database reachable.", "counts": { ... } }
```

## 5) Optional seed (first tenant)
Insert one tenant row manually in SQL editor so counts are non-zero.

```sql
insert into tenants (name, code, timezone) values ('Default Lab', 'DEFAULT', 'Asia/Kolkata');
```
