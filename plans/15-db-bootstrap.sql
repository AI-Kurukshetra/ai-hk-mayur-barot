-- Run this entire SQL in Supabase SQL Editor for project bgexnkfvwpzlnsptznta
-- It bootstraps all required LIS tables and policies used by the app.

-- 20260314_001_init.sql
-- Initial schema skeleton for PathologyLab Pro

create extension if not exists pgcrypto;

create type app_role as enum (
  'super_admin',
  'tenant_admin',
  'receptionist',
  'phlebotomist',
  'technician',
  'pathologist',
  'finance',
  'patient_portal'
);

create type order_status as enum (
  'ordered',
  'collected',
  'processing',
  'reviewed',
  'released'
);

create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  timezone text not null default 'Asia/Kolkata',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique,
  tenant_id uuid not null references tenants(id),
  full_name text not null,
  role app_role not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- TODO: add patients, tests, orders, order_items, samples, results, reports, payments, audit_logs.
-- TODO: enable RLS and add tenant + role policies.


-- 20260314_002_lis_core.sql
-- Core LIS schema + RLS for PathologyLab Pro

create extension if not exists pgcrypto;

create type if not exists payment_mode as enum (
  'cash',
  'card',
  'upi',
  'net_banking',
  'insurance'
);

create type if not exists sample_status as enum (
  'pending_collection',
  'collected',
  'received',
  'rejected',
  'disposed'
);

create type if not exists result_flag as enum (
  'normal',
  'high',
  'low',
  'critical'
);

create table if not exists patients (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  patient_code text not null,
  full_name text not null,
  dob date,
  sex text check (sex in ('male', 'female', 'other')),
  phone text,
  email text,
  address text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, patient_code)
);

create table if not exists tests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  test_code text not null,
  test_name text not null,
  department text,
  sample_type text,
  unit text,
  reference_range_json jsonb not null default '{}'::jsonb,
  price numeric(12,2) not null default 0,
  tat_hours integer not null default 24,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, test_code)
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  order_no text not null,
  patient_id uuid not null references patients(id),
  referring_doctor text,
  priority text not null default 'normal' check (priority in ('normal', 'urgent', 'stat')),
  status order_status not null default 'ordered',
  ordered_at timestamptz not null default now(),
  collected_at timestamptz,
  released_at timestamptz,
  total_amount numeric(12,2) not null default 0,
  paid_amount numeric(12,2) not null default 0,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, order_no)
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  order_id uuid not null references orders(id),
  test_id uuid not null references tests(id),
  status order_status not null default 'ordered',
  result_status text not null default 'pending' check (result_status in ('pending', 'entered', 'reviewed', 'released')),
  price numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, order_id, test_id)
);

create table if not exists samples (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  order_item_id uuid not null references order_items(id),
  sample_barcode text not null,
  container_type text,
  collected_by uuid references profiles(id),
  collected_at timestamptz,
  received_at timestamptz,
  status sample_status not null default 'pending_collection',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, sample_barcode)
);

create table if not exists results (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  order_item_id uuid not null references order_items(id),
  value_text text,
  value_numeric numeric(12,4),
  unit text,
  ref_low numeric(12,4),
  ref_high numeric(12,4),
  flag result_flag not null default 'normal',
  entered_by uuid references profiles(id),
  entered_at timestamptz,
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, order_item_id)
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  order_id uuid not null references orders(id),
  version_no integer not null default 1,
  storage_path text not null,
  checksum text,
  generated_at timestamptz not null default now(),
  released_by uuid references profiles(id),
  released_at timestamptz,
  created_at timestamptz not null default now(),
  unique (tenant_id, order_id, version_no)
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  order_id uuid not null references orders(id),
  amount numeric(12,2) not null,
  mode payment_mode not null,
  txn_ref text,
  paid_at timestamptz not null default now(),
  received_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  actor_profile_id uuid references profiles(id),
  entity text not null,
  entity_id uuid,
  action text not null,
  before_json jsonb,
  after_json jsonb,
  ip text,
  created_at timestamptz not null default now()
);

create index if not exists idx_orders_tenant_status_ordered_at on orders(tenant_id, status, ordered_at desc);
create index if not exists idx_order_items_tenant_order_id on order_items(tenant_id, order_id);
create index if not exists idx_samples_tenant_barcode on samples(tenant_id, sample_barcode);
create index if not exists idx_results_tenant_order_item on results(tenant_id, order_item_id);
create index if not exists idx_audit_logs_entity on audit_logs(tenant_id, entity, entity_id, created_at desc);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_patients_updated_at') then
    create trigger trg_patients_updated_at before update on patients for each row execute function set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_tests_updated_at') then
    create trigger trg_tests_updated_at before update on tests for each row execute function set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_orders_updated_at') then
    create trigger trg_orders_updated_at before update on orders for each row execute function set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_order_items_updated_at') then
    create trigger trg_order_items_updated_at before update on order_items for each row execute function set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_samples_updated_at') then
    create trigger trg_samples_updated_at before update on samples for each row execute function set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_results_updated_at') then
    create trigger trg_results_updated_at before update on results for each row execute function set_updated_at();
  end if;
end $$;

create or replace function current_tenant_id()
returns uuid
language sql
stable
as $$
  select nullif(auth.jwt() ->> 'tenant_id', '')::uuid
$$;

create or replace function current_role()
returns text
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'role', '')
$$;

create or replace function can_write_ops()
returns boolean
language sql
stable
as $$
  select current_role() in ('tenant_admin', 'receptionist', 'phlebotomist', 'technician', 'pathologist', 'finance')
$$;

alter table tenants enable row level security;
alter table profiles enable row level security;
alter table patients enable row level security;
alter table tests enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table samples enable row level security;
alter table results enable row level security;
alter table reports enable row level security;
alter table payments enable row level security;
alter table audit_logs enable row level security;

-- tenants
create policy if not exists tenants_select on tenants for select
using (id = current_tenant_id());

-- profiles
create policy if not exists profiles_select on profiles for select
using (tenant_id = current_tenant_id());

create policy if not exists profiles_write_admin on profiles for all
using (tenant_id = current_tenant_id() and current_role() in ('tenant_admin', 'super_admin'))
with check (tenant_id = current_tenant_id() and current_role() in ('tenant_admin', 'super_admin'));

-- Generic tenant select/read policies
create policy if not exists patients_select on patients for select
using (tenant_id = current_tenant_id());
create policy if not exists tests_select on tests for select
using (tenant_id = current_tenant_id());
create policy if not exists orders_select on orders for select
using (tenant_id = current_tenant_id());
create policy if not exists order_items_select on order_items for select
using (tenant_id = current_tenant_id());
create policy if not exists samples_select on samples for select
using (tenant_id = current_tenant_id());
create policy if not exists results_select on results for select
using (tenant_id = current_tenant_id());
create policy if not exists reports_select on reports for select
using (tenant_id = current_tenant_id());
create policy if not exists payments_select on payments for select
using (tenant_id = current_tenant_id());
create policy if not exists audit_logs_select on audit_logs for select
using (tenant_id = current_tenant_id());

-- Write policies by role
create policy if not exists patients_write on patients for all
using (tenant_id = current_tenant_id() and current_role() in ('tenant_admin', 'receptionist'))
with check (tenant_id = current_tenant_id() and current_role() in ('tenant_admin', 'receptionist'));

create policy if not exists tests_write on tests for all
using (tenant_id = current_tenant_id() and current_role() in ('tenant_admin'))
with check (tenant_id = current_tenant_id() and current_role() in ('tenant_admin'));

create policy if not exists orders_write on orders for all
using (tenant_id = current_tenant_id() and current_role() in ('tenant_admin', 'receptionist'))
with check (tenant_id = current_tenant_id() and current_role() in ('tenant_admin', 'receptionist'));

create policy if not exists order_items_write on order_items for all
using (tenant_id = current_tenant_id() and current_role() in ('tenant_admin', 'receptionist'))
with check (tenant_id = current_tenant_id() and current_role() in ('tenant_admin', 'receptionist'));

create policy if not exists samples_write on samples for all
using (tenant_id = current_tenant_id() and current_role() in ('tenant_admin', 'phlebotomist', 'technician'))
with check (tenant_id = current_tenant_id() and current_role() in ('tenant_admin', 'phlebotomist', 'technician'));

create policy if not exists results_write on results for all
using (tenant_id = current_tenant_id() and current_role() in ('tenant_admin', 'technician', 'pathologist'))
with check (tenant_id = current_tenant_id() and current_role() in ('tenant_admin', 'technician', 'pathologist'));

create policy if not exists reports_write on reports for all
using (tenant_id = current_tenant_id() and current_role() in ('tenant_admin', 'pathologist'))
with check (tenant_id = current_tenant_id() and current_role() in ('tenant_admin', 'pathologist'));

create policy if not exists payments_write on payments for all
using (tenant_id = current_tenant_id() and current_role() in ('tenant_admin', 'finance', 'receptionist'))
with check (tenant_id = current_tenant_id() and current_role() in ('tenant_admin', 'finance', 'receptionist'));

create policy if not exists audit_logs_write on audit_logs for insert
with check (tenant_id = current_tenant_id() and can_write_ops());

