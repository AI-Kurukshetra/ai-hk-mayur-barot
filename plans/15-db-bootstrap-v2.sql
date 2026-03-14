-- 15-db-bootstrap-v2.sql
-- Compatible bootstrap for Supabase SQL Editor

create extension if not exists pgcrypto;

-- Enums (compatible across versions)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type app_role as enum (
      'super_admin','tenant_admin','receptionist','phlebotomist','technician','pathologist','finance','patient_portal'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type order_status as enum (
      'ordered','collected','processing','reviewed','released'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'payment_mode') then
    create type payment_mode as enum (
      'cash','card','upi','net_banking','insurance'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'sample_status') then
    create type sample_status as enum (
      'pending_collection','collected','received','rejected','disposed'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'result_flag') then
    create type result_flag as enum (
      'normal','high','low','critical'
    );
  end if;
end $$;

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

-- Keep RLS enabled; service_role continues to work for backend APIs
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
