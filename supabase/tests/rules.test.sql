-- Database rule tests. Run after auth_stub.sql and schema.sql on a scratch PostgreSQL database.
\set ON_ERROR_STOP on

create function pg_temp.fails(stmt text, expected text) returns void language plpgsql as $$
begin
  begin
    execute stmt;
  exception when others then
    if sqlerrm ilike '%' || expected || '%' then return; end if;
    raise exception 'WRONG ERROR for [%]: %', stmt, sqlerrm;
  end;
  raise exception 'EXPECTED ERROR "%" but statement succeeded: %', expected, stmt;
end $$;

create function pg_temp.as_admin() returns void language sql as
  $$ select set_config('request.jwt.claims', '{"app_metadata":{"role":"admin"}}', false) $$;
create function pg_temp.as_user() returns void language sql as
  $$ select set_config('request.jwt.claims', '{"app_metadata":{}}', false) $$;

-- ===== Admin flow: TEST 2-5 numbers =====
select pg_temp.as_admin();
set role authenticated;

insert into people (id, full_name, mobile_number) values ('00000000-0000-0000-0000-000000000001', 'Rahul Patil', '9876543210');
insert into records (id, person_id, amount_given, date_given, amount_due, due_date)
  values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000001', 30000, '2026-09-01', 37000, '2026-10-15');
insert into payments (record_id, payment_amount, payment_date, payment_method)
  values ('00000000-0000-0000-0000-0000000000a1', 5000, '2026-09-10', 'Cash');

do $$ declare paid numeric; begin
  select sum(payment_amount) into paid from payments;
  if paid <> 5000 then raise exception 'paid should be 5000, got %', paid; end if;
  if 37000 - paid <> 32000 then raise exception 'remaining should be 32000'; end if;
  raise notice 'PASS  Rs 37,000 due, Rs 5,000 paid -> Rs 32,000 remaining';
end $$;

select pg_temp.fails($q$insert into payments (record_id, payment_amount, payment_date, payment_method)
  values ('00000000-0000-0000-0000-0000000000a1', 32001, '2026-09-11', 'UPI')$q$, 'greater than the remaining amount');
do $$ begin raise notice 'PASS  payment above the remaining amount is rejected'; end $$;

insert into payments (record_id, payment_amount, payment_date, payment_method)
  values ('00000000-0000-0000-0000-0000000000a1', 32000, '2026-09-12', 'UPI');
do $$ begin
  if (select sum(payment_amount) from payments) <> 37000 then raise exception 'should be fully paid'; end if;
  raise notice 'PASS  paying the exact remaining amount is accepted (remaining 0)';
end $$;

select pg_temp.fails($q$insert into payments (record_id, payment_amount, payment_date, payment_method)
  values ('00000000-0000-0000-0000-0000000000a1', 1, '2026-09-13', 'Cash')$q$, 'greater than the remaining amount');
do $$ begin raise notice 'PASS  nothing can be paid on a fully paid record (remaining never negative)'; end $$;

select pg_temp.fails($q$update records set amount_due = 30000 where id = '00000000-0000-0000-0000-0000000000a1'$q$, 'less than the amount already paid');
do $$ begin raise notice 'PASS  amount due cannot be edited below the amount already paid'; end $$;

-- ===== Constraints (a fresh record with room, so the payment-limit trigger does not mask the check) =====
insert into records (id, person_id, amount_given, date_given, amount_due, due_date)
  values ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-000000000001', 1000, '2026-09-01', 1000, '2026-10-01');
select pg_temp.fails($q$insert into records (person_id, amount_given, date_given, amount_due, due_date)
  values ('00000000-0000-0000-0000-000000000001', 0, '2026-09-01', 100, '2026-10-01')$q$, 'check constraint');
select pg_temp.fails($q$insert into payments (record_id, payment_amount, payment_date, payment_method)
  values ('00000000-0000-0000-0000-0000000000a2', 0, '2026-09-01', 'Cash')$q$, 'check constraint');
select pg_temp.fails($q$insert into payments (record_id, payment_amount, payment_date, payment_method)
  values ('00000000-0000-0000-0000-0000000000a2', 1, '2026-09-01', 'Cheque')$q$, 'check constraint');
select pg_temp.fails($q$insert into people (full_name, mobile_number) values ('X', '12345')$q$, 'check constraint');
select pg_temp.fails($q$insert into people (full_name, mobile_number, aadhaar_number) values ('X', '9876543210', '12345')$q$, 'check constraint');
select pg_temp.fails($q$insert into people (full_name, mobile_number) values ('   ', '9876543210')$q$, 'check constraint');
select pg_temp.fails($q$insert into messages (person_id, message_text, message_type, recipient_mobile)
  values ('00000000-0000-0000-0000-000000000001', 'hi', 'spam', '9876543210')$q$, 'check constraint');
do $$ begin raise notice 'PASS  amount, method, mobile, Aadhaar, name and message-type constraints'; end $$;

-- ===== TEST 9: archive keeps history; TEST 11/12 message history =====
update people set is_archived = true where id = '00000000-0000-0000-0000-000000000001';
do $$ begin
  if (select count(*) from records) <> 2 or (select count(*) from payments) <> 2 then raise exception 'history lost'; end if;
  raise notice 'PASS  archiving a person keeps their records and payments';
end $$;

insert into messages (person_id, record_id, message_text, message_type, recipient_mobile)
  values ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'Hello', 'custom', '9876543210');
do $$ begin
  if (select status from messages) <> 'pending' then raise exception 'default status should be pending'; end if;
  raise notice 'PASS  message history row is stored (default status pending)';
end $$;

-- ===== Optional bank details =====
insert into people (id, full_name, mobile_number, branch_name, branch_location, account_number)
  values ('00000000-0000-0000-0000-000000000002', 'Branch Test', '9876500000', 'Pune Main', 'FC Road, Pune', '000123456789');
do $$ begin
  if (select account_number from people where id = '00000000-0000-0000-0000-000000000002') <> '000123456789'
  then raise exception 'leading zeros lost'; end if;
  if (select account_number from people where id = '00000000-0000-0000-0000-000000000001') is not null
  then raise exception 'people without bank details should have NULL'; end if;
  raise notice 'PASS  account number keeps leading zeros; bank details are optional';
end $$;
select pg_temp.fails($q$insert into people (full_name, mobile_number, account_number) values ('X', '9876543210', '12ab34567890')$q$, 'check constraint');
select pg_temp.fails($q$insert into people (full_name, mobile_number, account_number) values ('X', '9876543210', '12345')$q$, 'check constraint');
do $$ begin raise notice 'PASS  invalid account numbers are rejected'; end $$;

-- ===== No deletes, history protected =====
select pg_temp.fails('delete from people', 'permission denied');
select pg_temp.fails('delete from payments', 'permission denied');
select pg_temp.fails('delete from messages', 'permission denied');
do $$ begin raise notice 'PASS  no DELETE allowed on any table, even for an admin'; end $$;

-- ===== RLS: signed in but not admin =====
select pg_temp.as_user();
do $$ begin
  if (select count(*) from people) + (select count(*) from records) + (select count(*) from payments) + (select count(*) from messages) <> 0
  then raise exception 'non-admin can read data'; end if;
  raise notice 'PASS  signed-in non-admin sees no data';
end $$;
select pg_temp.fails($q$insert into people (full_name, mobile_number) values ('Hacker', '9999999999')$q$, 'row-level security');
do $$ begin raise notice 'PASS  signed-in non-admin cannot insert'; end $$;

update people set full_name = 'Hacked';  -- RLS hides every row from this user, so this changes nothing
reset role;
do $$ begin
  if (select full_name from people where id = '00000000-0000-0000-0000-000000000001') <> 'Rahul Patil' then raise exception 'non-admin changed data'; end if;
  raise notice 'PASS  signed-in non-admin cannot update';
end $$;

-- ===== Foreign keys protect history (even for the table owner) =====
select pg_temp.fails($q$delete from people where id = '00000000-0000-0000-0000-000000000001'$q$, 'foreign key');
select pg_temp.fails($q$delete from records where id = '00000000-0000-0000-0000-0000000000a1'$q$, 'foreign key');
do $$ begin raise notice 'PASS  foreign keys block deleting a person or record that has history'; end $$;

-- ===== Signed out (anon) =====
set role anon;
select pg_temp.fails('select * from people', 'permission denied');
select pg_temp.fails('select * from payments', 'permission denied');
select pg_temp.fails($q$insert into people (full_name, mobile_number) values ('X', '9876543210')$q$, 'permission denied');
reset role;
do $$ begin raise notice 'PASS  signed-out visitors cannot read or write anything'; end $$;

-- ===== updated_at trigger =====
do $$ begin
  if not (select updated_at > created_at from people where id = '00000000-0000-0000-0000-000000000001') then raise exception 'updated_at not maintained'; end if;
  raise notice 'PASS  updated_at is maintained automatically';
end $$;

do $$ begin raise notice 'ALL DATABASE TESTS PASSED'; end $$;
