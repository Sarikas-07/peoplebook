-- PeopleBook database schema
-- Paste this whole file into the Supabase SQL Editor and run it once.
-- Relationships:  people -< records -< payments   and   people -< messages

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------
-- Shared trigger: keep updated_at current
-- ---------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------
-- people
-- ---------------------------------------------------------------
create table if not exists public.people (
  id                        uuid primary key default gen_random_uuid(),
  full_name                 text not null check (length(btrim(full_name)) > 0),
  address                   text,
  mobile_number             text not null check (mobile_number ~ '^\+?[0-9]{10,13}$'),
  alternative_mobile_number text check (alternative_mobile_number is null or alternative_mobile_number ~ '^\+?[0-9]{10,13}$'),
  aadhaar_number            text check (aadhaar_number is null or aadhaar_number ~ '^[0-9]{12}$'),
  notes                     text,
  is_archived               boolean not null default false,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

-- Optional bank details (added later). Safe on an existing database: adds columns only, existing rows are untouched.
-- account_number is TEXT so leading zeros are kept.
alter table public.people
  add column if not exists branch_name text,
  add column if not exists branch_location text,
  add column if not exists account_number text;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'people_account_number_format') then
    alter table public.people add constraint people_account_number_format
      check (account_number is null or account_number ~ '^[0-9]{9,18}$');
  end if;
end $$;

create index if not exists idx_people_full_name on public.people (lower(full_name));
create index if not exists idx_people_mobile_number on public.people (mobile_number);
create index if not exists idx_people_is_archived on public.people (is_archived);

drop trigger if exists trg_people_updated_at on public.people;
create trigger trg_people_updated_at before update on public.people
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------
-- records
-- Remaining amount and status are NOT stored; they are always
-- calculated from amount_due, the payments, and the due date.
-- ---------------------------------------------------------------
create table if not exists public.records (
  id           uuid primary key default gen_random_uuid(),
  person_id    uuid not null references public.people (id) on delete restrict,
  amount_given numeric(14,2) not null check (amount_given > 0),
  date_given   date not null,
  amount_due   numeric(14,2) not null check (amount_due > 0),
  due_date     date not null,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_records_person_id on public.records (person_id);
create index if not exists idx_records_due_date on public.records (due_date);

drop trigger if exists trg_records_updated_at on public.records;
create trigger trg_records_updated_at before update on public.records
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------
-- payments
-- ---------------------------------------------------------------
create table if not exists public.payments (
  id             uuid primary key default gen_random_uuid(),
  record_id      uuid not null references public.records (id) on delete restrict,
  payment_amount numeric(14,2) not null check (payment_amount > 0),
  payment_date   date not null,
  payment_method text not null check (payment_method in ('Cash', 'UPI', 'Bank Transfer', 'Other')),
  notes          text,
  created_at     timestamptz not null default now()
);

create index if not exists idx_payments_record_id on public.payments (record_id);
create index if not exists idx_payments_payment_date on public.payments (payment_date);

-- Database-level guard: a payment can never exceed the remaining amount.
-- Locks the record row so two simultaneous payments cannot both pass.
create or replace function public.guard_payment_amount()
returns trigger language plpgsql as $$
declare
  v_due  numeric;
  v_paid numeric;
begin
  select amount_due into v_due from public.records where id = new.record_id for update;
  select coalesce(sum(payment_amount), 0) into v_paid
    from public.payments
   where record_id = new.record_id and id is distinct from new.id;

  if v_paid + new.payment_amount > v_due then
    raise exception 'Payment cannot be greater than the remaining amount.'
      using errcode = 'check_violation';
  end if;
  return new;
end $$;

drop trigger if exists trg_payments_guard on public.payments;
create trigger trg_payments_guard before insert or update of payment_amount, record_id on public.payments
  for each row execute function public.guard_payment_amount();

-- Amount due cannot be edited below what has already been paid.
create or replace function public.guard_record_amount_due()
returns trigger language plpgsql as $$
declare v_paid numeric;
begin
  select coalesce(sum(payment_amount), 0) into v_paid from public.payments where record_id = new.id;
  if new.amount_due < v_paid then
    raise exception 'Amount due cannot be less than the amount already paid.'
      using errcode = 'check_violation';
  end if;
  return new;
end $$;

drop trigger if exists trg_records_guard_due on public.records;
create trigger trg_records_guard_due before update of amount_due on public.records
  for each row execute function public.guard_record_amount_due();

-- ---------------------------------------------------------------
-- messages (SMS history)
-- ---------------------------------------------------------------
create table if not exists public.messages (
  id                  uuid primary key default gen_random_uuid(),
  person_id           uuid not null references public.people (id) on delete restrict,
  record_id           uuid references public.records (id) on delete restrict,
  message_text        text not null check (length(btrim(message_text)) > 0),
  message_type        text not null check (message_type in
                        ('payment_confirmation', 'upcoming_reminder', 'overdue_reminder', 'custom')),
  recipient_mobile    text not null,
  provider_message_id text,
  status              text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  sent_at             timestamptz,
  created_at          timestamptz not null default now()
);

create index if not exists idx_messages_person_id on public.messages (person_id);
create index if not exists idx_messages_record_id on public.messages (record_id);
-- Used by automatic reminders to check whether a reminder was already sent.
create index if not exists idx_messages_reminder_lookup
  on public.messages (record_id, message_type, status, created_at desc);

-- ---------------------------------------------------------------
-- Row Level Security: ADMIN users only.
-- is_admin() reads the "role" stored in the user's app_metadata. app_metadata can only be
-- changed by the project owner (SQL editor / service role), never by the signed-in user.
-- No policy exists for the anon role, so signed-out visitors cannot read or change anything.
-- ---------------------------------------------------------------
create or replace function public.is_admin()
returns boolean language sql stable as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
$$;

alter table public.people   enable row level security;
alter table public.records  enable row level security;
alter table public.payments enable row level security;
alter table public.messages enable row level security;

-- No DELETE privilege on any table: history can only be archived, never erased from the app.
revoke all on public.people, public.records, public.payments, public.messages from anon;
revoke delete on public.people, public.records, public.payments, public.messages from authenticated;
grant select, insert, update on public.people, public.records, public.payments, public.messages to authenticated;

drop policy if exists "people_admin_all" on public.people;
create policy "people_admin_all" on public.people
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "records_admin_all" on public.records;
create policy "records_admin_all" on public.records
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "payments_admin_all" on public.payments;
create policy "payments_admin_all" on public.payments
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "messages_admin_all" on public.messages;
create policy "messages_admin_all" on public.messages
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Remove the older policy names if you ran an earlier version of this file.
drop policy if exists "people_authenticated_all" on public.people;
drop policy if exists "records_authenticated_all" on public.records;
drop policy if exists "payments_authenticated_all" on public.payments;
drop policy if exists "messages_authenticated_all" on public.messages;

-- ---------------------------------------------------------------
-- ADMIN SETUP (do these after running this file):
--  1. Authentication > Providers > Email: turn OFF "Allow new users to sign up".
--  2. Authentication > Users: create your admin user (email + password).
--  3. Run this once, with your admin email:
--
--     update auth.users
--        set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
--      where email = 'YOUR_ADMIN_EMAIL';
--
--  4. Sign out and sign in again so the new role is in your session.
-- Without step 3 nobody can see any data, even when signed in.
-- ---------------------------------------------------------------
