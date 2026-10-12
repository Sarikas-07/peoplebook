-- OPTIONAL sample data for trying the app. Do NOT run this on your real database.
-- Run it in the Supabase SQL Editor after schema.sql. Safe to run twice (it checks the mobile number).
-- Result: Rahul Patil, Amount Given 30,000, Amount Due 37,000, one 5,000 payment
--         -> Amount Paid 5,000, Remaining 32,000, Status Active.
with p as (
  insert into people (full_name, mobile_number, address, notes)
  select 'Rahul Patil', '9876543210', 'Sample address', 'Sample data'
   where not exists (select 1 from people where mobile_number = '9876543210')
  returning id
), r as (
  insert into records (person_id, amount_given, date_given, amount_due, due_date, notes)
  select id, 30000, current_date - 14, 37000, current_date + 30, 'Sample record' from p
  returning id
)
insert into payments (record_id, payment_amount, payment_date, payment_method, notes)
select id, 5000, current_date - 7, 'Cash', 'Sample payment' from r;
