-- =====================================================================
-- Fuel Forward Drive — Purchase Order system (reference schema)
-- Target project: fytksuhwheohqcobuzbk (shared with the web portal).
-- The mobile app reads/writes these tables and subscribes to them over
-- Realtime. Column sets below mirror the live backend.
-- =====================================================================

-- 1. Purchase orders -----------------------------------------------------
create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  order_id uuid,                    -- links to public.orders when present
  customer_id uuid references auth.users (id) on delete set null,
  po_code text not null unique,     -- e.g. PO-202608211447-A3F9K2
  status text not null default 'PO_GENERATED',
  assigned_driver_id uuid,          -- references public.riders (id)
  delivery_address text not null,
  delivery_latitude double precision,
  delivery_longitude double precision,
  payment_status text not null default 'PENDING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update on public.purchase_orders to authenticated;
grant all on public.purchase_orders to service_role;

alter table public.purchase_orders enable row level security;

create policy "Customers read their own purchase orders"
  on public.purchase_orders for select to authenticated
  using (customer_id = auth.uid());

create policy "Customers create their own purchase orders"
  on public.purchase_orders for insert to authenticated
  with check (customer_id = auth.uid());

create policy "Customers update their own purchase orders"
  on public.purchase_orders for update to authenticated
  using (customer_id = auth.uid());

-- 2. Three-station priority fulfilment options ---------------------------
create table if not exists public.purchase_order_fulfilment_options (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders (id) on delete cascade,
  partner_id text not null,         -- station / partner identifier
  priority int not null check (priority between 1 and 3),
  status text not null default 'PENDING',   -- PENDING | ACTIVATED | FAILED | FULFILLED
  activated_at timestamptz,
  failed_at timestamptz,
  fulfilled_at timestamptz,
  unique (purchase_order_id, partner_id),
  unique (purchase_order_id, priority)
);

grant select, insert, update on public.purchase_order_fulfilment_options to authenticated;
grant all on public.purchase_order_fulfilment_options to service_role;

alter table public.purchase_order_fulfilment_options enable row level security;

create policy "Customers read their fulfilment options"
  on public.purchase_order_fulfilment_options for select to authenticated
  using (exists (
    select 1 from public.purchase_orders po
    where po.id = purchase_order_id and po.customer_id = auth.uid()
  ));

create policy "Customers create their fulfilment options"
  on public.purchase_order_fulfilment_options for insert to authenticated
  with check (exists (
    select 1 from public.purchase_orders po
    where po.id = purchase_order_id and po.customer_id = auth.uid()
  ));

-- 3. Proof of Delivery Codes ---------------------------------------------
create table if not exists public.podc_codes (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders (id) on delete cascade,
  order_id uuid,
  customer_id uuid references auth.users (id) on delete set null,
  podc_code text not null,          -- e.g. PODC-2026082114-K7J2M9Q5
  status text not null default 'ACTIVE',    -- ACTIVE | SUBMITTED | VERIFIED | EXPIRED
  delivery_person_id uuid,
  generated_at timestamptz not null default now(),
  submitted_at timestamptz,
  verified_at timestamptz,
  expires_at timestamptz,
  unique (purchase_order_id)
);

grant select, insert, update on public.podc_codes to authenticated;
grant all on public.podc_codes to service_role;

alter table public.podc_codes enable row level security;

create policy "Customers read their PODC codes"
  on public.podc_codes for select to authenticated
  using (customer_id = auth.uid());

create policy "Customers insert their PODC codes"
  on public.podc_codes for insert to authenticated
  with check (customer_id = auth.uid());

create policy "Customers update their PODC codes"
  on public.podc_codes for update to authenticated
  using (customer_id = auth.uid());

-- 4. Riders table is assumed to exist already (live location tracking) ---
-- Required columns used by the app:
--   id, full_name, phone, vehicle, rating,
--   current_latitude, current_longitude, updated_at

-- 5. Realtime -------------------------------------------------------------
alter publication supabase_realtime add table public.purchase_orders;
alter publication supabase_realtime add table public.purchase_order_fulfilment_options;
alter publication supabase_realtime add table public.podc_codes;
alter publication supabase_realtime add table public.riders;
