# Migration Re-Run Steps (Updated)

Use this fixed SQL file (v2):
- `plans/15-db-bootstrap-v2.sql`

## Steps
1. Supabase -> SQL Editor -> New query
2. Paste all content of `plans/15-db-bootstrap-v2.sql`
3. Run
4. Verify with:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'tenants','profiles','patients','tests','orders','order_items','samples','results','reports','payments','audit_logs'
  )
order by table_name;
```

Expected: 11 rows.
