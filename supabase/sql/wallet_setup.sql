-- FuelNow wallet system
-- Run this in the SQL editor of Supabase project fytksuhwheohqcobuzbk.

-- 1) Wallets --------------------------------------------------------------
create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  balance numeric(14,2) not null default 0,
  currency text not null default 'NGN',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

grant select, insert, update on public.wallets to authenticated;
grant all on public.wallets to service_role;

alter table public.wallets enable row level security;

drop policy if exists "Users read own wallet" on public.wallets;
create policy "Users read own wallet" on public.wallets
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users create own wallet" on public.wallets;
create policy "Users create own wallet" on public.wallets
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users update own wallet" on public.wallets;
create policy "Users update own wallet" on public.wallets
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 2) Wallet transactions ---------------------------------------------------
do $$ begin
  create type public.wallet_txn_type as enum ('credit', 'debit');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.wallet_txn_status as enum ('pending', 'completed', 'failed');
exception when duplicate_object then null; end $$;

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  amount numeric(14,2) not null check (amount > 0),
  type public.wallet_txn_type not null,
  description text,
  status public.wallet_txn_status not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists wallet_transactions_wallet_id_idx
  on public.wallet_transactions (wallet_id, created_at desc);

grant select, insert, update on public.wallet_transactions to authenticated;
grant all on public.wallet_transactions to service_role;

alter table public.wallet_transactions enable row level security;

drop policy if exists "Users read own transactions" on public.wallet_transactions;
create policy "Users read own transactions" on public.wallet_transactions
  for select to authenticated
  using (exists (select 1 from public.wallets w where w.id = wallet_id and w.user_id = auth.uid()));

drop policy if exists "Users create own transactions" on public.wallet_transactions;
create policy "Users create own transactions" on public.wallet_transactions
  for insert to authenticated
  with check (exists (select 1 from public.wallets w where w.id = wallet_id and w.user_id = auth.uid()));

drop policy if exists "Users update own transactions" on public.wallet_transactions;
create policy "Users update own transactions" on public.wallet_transactions
  for update to authenticated
  using (exists (select 1 from public.wallets w where w.id = wallet_id and w.user_id = auth.uid()))
  with check (exists (select 1 from public.wallets w where w.id = wallet_id and w.user_id = auth.uid()));

-- 3) Atomic spend ----------------------------------------------------------
-- Deducts from the caller's own wallet and logs a completed debit.
create or replace function public.spend_from_wallet(_amount numeric, _description text)
returns public.wallets
language plpgsql
security definer
set search_path = public
as $$
declare
  w public.wallets;
begin
  if _amount is null or _amount <= 0 then
    raise exception 'Invalid amount';
  end if;

  select * into w from public.wallets where user_id = auth.uid() for update;
  if w.id is null then
    raise exception 'Wallet not found';
  end if;
  if w.balance < _amount then
    raise exception 'Insufficient balance';
  end if;

  update public.wallets
     set balance = balance - _amount, updated_at = now()
   where id = w.id
  returning * into w;

  insert into public.wallet_transactions (wallet_id, amount, type, description, status)
  values (w.id, _amount, 'debit', _description, 'completed');

  return w;
end;
$$;

revoke all on function public.spend_from_wallet(numeric, text) from public, anon;
grant execute on function public.spend_from_wallet(numeric, text) to authenticated;

-- 4) Auto-create a wallet for every profile --------------------------------
create or replace function public.handle_new_profile_wallet()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.wallets (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_profile_created_wallet on public.profiles;
create trigger on_profile_created_wallet
  after insert on public.profiles
  for each row execute function public.handle_new_profile_wallet();
