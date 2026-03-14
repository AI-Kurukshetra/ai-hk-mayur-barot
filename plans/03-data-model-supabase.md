# 03. Data Model (Supabase)

## Design Principles
- Normalize core transactional entities.
- Keep immutable snapshots for released reports.
- Separate operational and analytics concerns.

## Core Tables
- `tenants(id, name, code, timezone, is_active, created_at)`
- `profiles(id, auth_user_id, tenant_id, full_name, role, phone, is_active, created_at)`
- `patients(id, tenant_id, patient_code, full_name, dob, sex, phone, email, address, created_by, created_at)`
- `tests(id, tenant_id, test_code, test_name, department, sample_type, unit, reference_range_json, price, tat_hours, is_active)`
- `orders(id, tenant_id, order_no, patient_id, referring_doctor, priority, status, ordered_at, collected_at, released_at, total_amount, paid_amount)`
- `order_items(id, tenant_id, order_id, test_id, status, result_status, price, discount, created_at)`
- `samples(id, tenant_id, order_item_id, sample_barcode, container_type, collected_by, collected_at, received_at, status)`
- `results(id, tenant_id, order_item_id, value_text, value_numeric, unit, ref_low, ref_high, flag, entered_by, entered_at, reviewed_by, reviewed_at)`
- `reports(id, tenant_id, order_id, version_no, storage_path, checksum, generated_at, released_by, released_at)`
- `payments(id, tenant_id, order_id, amount, mode, txn_ref, paid_at, received_by)`
- `audit_logs(id, tenant_id, actor_profile_id, entity, entity_id, action, before_json, after_json, ip, created_at)`

## Keys and Constraints
- Unique per tenant:
- `(tenant_id, patient_code)`
- `(tenant_id, test_code)`
- `(tenant_id, order_no)`
- `(tenant_id, sample_barcode)`

- Foreign keys cascade rules:
- `orders.patient_id -> patients.id` (restrict delete)
- `order_items.order_id -> orders.id` (cascade delete only while draft)
- `results.order_item_id -> order_items.id` (restrict post release)

## Indexing Strategy
- `orders(tenant_id, status, ordered_at desc)`
- `order_items(tenant_id, order_id)`
- `samples(tenant_id, sample_barcode)`
- `results(tenant_id, order_item_id, reviewed_at)`
- `audit_logs(tenant_id, entity, entity_id, created_at desc)`

## RLS Strategy
- Enable RLS on every tenant table.
- Policy baseline:
- `tenant_id = current_setting('request.jwt.claims', true)::json->>'tenant_id'`
- Role-based policy subsets for write operations.

## Migration Plan
1. Create schema and enums (`order_status`, `role`, `payment_mode`).
2. Add constraints and indexes.
3. Enable RLS and add deny-by-default policies.
4. Seed master data and admin account.
5. Add migration smoke test script for CI.
