-- =====================================================================
-- Fuel Forward Drive — Purchase Order system
-- Run this in the SQL editor of the shared portal Supabase project
-- (zcjhmnfmrfbczbwcevey) to give the mobile app + Dispatch app a
-- realtime Purchase Order pipeline.
-- =====================================================================

-- 1. Purchase orders -----------------------------------------------------
create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  po_code text not null unique,
  customer_id uuid references auth.users (id) on delete set null,
  product_name text not null,
  quantity numeric not null,
  unit text not null default 'L',
  subtotal numeric not null default 0,
  delivery_fee numeric not null default 0,
  total_amount numeric not null default 0,
  delivery_address text not null,
  dest_lat double precision,
  dest_lng double precision,
  service_level text not null default 'standard',
  payment_method text not null default 'wallet',
  status text not null default 'PO_GENERATED',
  fulfilling_station_id text,
  rider_id uuid,
  podc text,
  podc_code text,
  rating_driver int,
  rating_station int,
  cancelled boolean not null default false,
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
  station_id text not null,
  priority int not null check (priority between 1 and 3),
  created_at timestamptz not null default now(),
  unique (purchase_order_id, station_id),
  unique (purchase_order_id, priority)
);

grant select, insert on public.purchase_order_fulfilment_options to authenticated;
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
  code text not null,            -- 6-digit customer-facing code
  full_code text not null,       -- e.g. PODC-2026082114-K7J2M9Q5
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (purchase_order_id)
);

grant select, insert, update on public.podc_codes to authenticated;
grant all on public.podc_codes to service_role;

alter table public.podc_codes enable row level security;

create policy "Customers read their PODC codes"
  on public.podc_codes for select to authenticated
  using (exists (
    select 1 from public.purchase_orders po
    where po.id = purchase_order_id and po.customer_id = auth.uid()
  ));

create policy "Customers insert their PODC codes"
  on public.podc_codes for insert to authenticated
  with check (exists (
    select 1 from public.purchase_orders po
    where po.id = purchase_order_id and po.customer_id = auth.uid()
  ));

-- 4. Riders (live location for tracking) ---------------------------------
create table if not exists public.riders (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  vehicle text,
  rating numeric default 5,
  is_available boolean not null default true,
  current_latitude double precision,
  current_longitude double precision,
  updated_at timestamptz not null default now()
);

grant select on public.riders to authenticated;
grant all on public.riders to service_role;

alter table public.riders enable row level security;

create policy "Authenticated users can read rider locations"
  on public.riders for select to authenticated
  using (true);

-- 5. Realtime -------------------------------------------------------------
alter publication supabase_realtime add table public.purchase_orders;
alter publication supabase_realtime add table public.podc_codes;
alter publication supabase_realtime add table public.riders;
