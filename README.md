# PeopleBook

*Simple. Secure. Organized.*

## 1. Project overview

PeopleBook is a private, admin-only web application for a small business. It keeps track of **People**, the financial **Records** kept for each person, the **Payments** received against those records, **Reports**, and the SMS **Messages** sent to people.

- Remaining amount and status are **always calculated** from the actual payments, never typed in or stored.
- Status is one of **Active**, **Overdue** or **Paid** (Paid when nothing remains; Overdue when the due date has passed and something remains).
- Amounts are shown in Indian format (₹1,50,000) and dates like `15 Sep 2026`.
- The application name is changed in one place: `lib/constants.ts`.

## 2. Technology stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Supabase (PostgreSQL + Auth), Lucide icons, deployed on Vercel. No other frameworks.

## 3. Installation

Requirements: Node.js 20.9 or newer, a free Supabase project.

```bash
npm install
cp .env.local.example .env.local   # then fill in the values (section 4)
```

## 4. Environment variables

| Variable | Needed for | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | the app | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | the app | the *anon* key (safe for browsers) |
| `SMS_PROVIDER` | SMS | `msg91` |
| `SMS_API_KEY`, `SMS_SENDER_ID`, `SMS_TEMPLATE_ID` | SMS | server-side only |
| `SMS_TEMPLATE_VARIABLE` | SMS (optional) | default `VAR1` |
| `SUPABASE_SERVICE_ROLE_KEY` | automatic reminders | server-side only. Never prefix with `NEXT_PUBLIC_` |
| `CRON_SECRET` | automatic reminders | long random value |
| `AUTO_REMINDERS_ENABLED` | automatic reminders | only the exact value `true` turns sending on |
| `REMINDER_UPCOMING_DAYS`, `REMINDER_OVERDUE_REPEAT_DAYS`, `REMINDER_MAX_PER_RUN` | optional | defaults 3, 7, 50 |

The app works with only the first two. Everything else is optional.

## 5. Supabase setup

1. Create a project at supabase.com.
2. **Authentication → Providers → Email:** turn **off** "Allow new users to sign up".
3. Copy the project URL and anon key into `.env.local`.

## 6. Database setup

1. Open **SQL Editor**, paste all of `supabase/schema.sql`, and run it. It creates the four tables, relationships, constraints, indexes, the database safety triggers and the access rules. It is safe to run again.
2. *(Optional, for trying the app)* run `supabase/seed.sql` to add one sample person. Do not run it on your real data.

**Updating an existing database:** re-run `supabase/schema.sql`. It is safe to run again and, for the optional bank details (branch name, branch location, account number), it only adds three empty columns; existing people, records and payments are not touched.

Database rules worth knowing: a payment can never exceed the remaining amount (even if two are saved at once), the amount due cannot be edited below what has been paid, and nothing can be deleted from the app. People are archived, not erased.

## 7. Authentication setup

1. **Authentication → Users → Add user:** create your admin (email and password). Passwords are handled entirely by Supabase.
2. In the SQL Editor run this once, with your email:

   ```sql
   update auth.users
      set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
    where email = 'YOUR_ADMIN_EMAIL';
   ```
3. Sign in at `/login`. If you were already signed in, sign out and in again.

Signed-in accounts **without** the admin role see no data and are turned away at login.

## 8. Local development

```bash
npm run dev      # http://localhost:3000
npm run lint
npm test         # unit tests (calculations, templates, SMS, reminders, CSV, search)
npm run build
```

**Database tests (optional, needs a scratch PostgreSQL, not Supabase):**

```bash
createdb pbtest
psql -d pbtest -f supabase/tests/auth_stub.sql
psql -d pbtest -f supabase/schema.sql
psql -d pbtest -f supabase/tests/rules.test.sql   # prints PASS lines
```

**Manual checklist after setup:**
1. Sign in → Dashboard shows. 2. Add a person → it appears in People. 3. Open the person → add a record. 4. Open the record → add a ₹5,000 payment; check Amount Paid and Remaining. 5. Pay the rest → status Paid, remaining ₹0. 6. Add a record with a past due date → Overdue. 7. Search by name and by mobile. 8. Edit a person. 9. Archive a person (history stays). 10. Reports → apply filters, Export CSV. 11. Record a payment → "Send Payment Confirmation". 12. Messages → history. 13. Logout. 14. Open `/dashboard` signed out → redirected to `/login`.

## 9. SMS provider setup

Sending SMS needs a gateway. PeopleBook includes MSG91 (`lib/sms/providers/msg91.ts`); the rest of the app only calls `sendSMS()` in `lib/sms/service.ts`.

1. Create an MSG91 account, complete DLT registration, and get your **auth key**, **sender ID** and an approved **Flow template ID**.
2. Set `SMS_PROVIDER=msg91`, `SMS_API_KEY`, `SMS_SENDER_ID`, `SMS_TEMPLATE_ID`.
3. The full message text is sent as one template variable (default `VAR1`), so the approved template should consist of that single variable. Confirm with MSG91 that this is accepted for your account; otherwise the provider file needs one template per message type.
4. Check **Settings** → "SMS service is configured".

Until this is done the app works normally and shows "SMS service is not configured." Nothing is sent and no fake history is created. To add another gateway, add a file in `lib/sms/providers/` and register it in `lib/sms/provider.ts`.

SMS credentials exist only in server-side code (`lib/sms/service.ts` cannot be imported by browser code).

## 10. How message templates work

Templates live in `lib/sms/templates.ts`: Payment Confirmation, Upcoming Due Reminder, Overdue Reminder, and Custom Message (empty). Placeholders: `{person_name}`, `{payment_amount}`, `{total_paid}`, `{remaining_amount}`, `{due_date}`.

On the **Messages** page you choose a person, a type and (for template types) a record. The text is filled in with real figures, and you can edit it before pressing Send. After you record a payment, the record page offers **Send Payment Confirmation**, which opens Messages with that payment's amount filled in. Every real attempt is stored in Message History as Pending, then Sent or Failed.

## 11. How automatic reminders work

A daily job (`vercel.json`, 03:30 UTC = 09:00 IST) calls `/api/cron/reminders`:

1. Finds records due within `REMINDER_UPCOMING_DAYS` days, or overdue, with money still outstanding, for people who are not archived.
2. Checks Message History to skip duplicates: one upcoming reminder per record; overdue reminders at most every `REMINDER_OVERDUE_REPEAT_DAYS` days; failed attempts retried at most 3 times per period.
3. Builds the message from the template and saves it as Pending.
4. Sends it, then marks it Sent (with the provider's ID) or Failed.

Safety: **nothing is sent unless `AUTO_REMINDERS_ENABLED=true`**; otherwise a run only previews. At most `REMINDER_MAX_PER_RUN` messages go out per run. Payment confirmations are never automatic. Settings shows the current state and rules.

## 12. Deployment to Vercel

1. Push the project to a Git repository and import it in Vercel.
2. Add the environment variables from section 4 (Production).
3. Deploy. Vercel Cron picks up `vercel.json`. When `CRON_SECRET` is set, Vercel sends it automatically with each cron call.
4. In Supabase → Authentication → URL Configuration, add your Vercel URL as the Site URL.
5. Pick a Vercel region near your users (for example Mumbai) in Project Settings → Functions.

## 13. Security notes

- Supabase Auth only; no passwords are stored by the app.
- Row Level Security on every table; only accounts with the admin role can read or write. Signed-out visitors can do nothing. No delete permission exists.
- Protected routes redirect to `/login`; every server action re-checks the signed-in admin and validates its input on the server.
- Aadhaar is masked everywhere (`XXXX XXXX 1234`), never selected in lists, reports or messages, never put in a URL, never logged, never sent back to the form.
- The service-role key and SMS credentials are used only in server-only files; the build fails if browser code imports them.
- Account numbers are stored as text (leading zeros kept), validated as 9–18 digits, shown masked (`XXXXXX1234`), and never selected in lists, reports or messages. The full number is fetched only when the eye icon is pressed, and hides again after 30 seconds. Like Aadhaar, it is stored as plain text in the database (see Known limitations).
- The mobile number for an SMS always comes from the database, not the browser. CSV exports neutralise spreadsheet formulas.
- Security headers (no framing, no content sniffing, HSTS, strict referrer policy) are set in `next.config.ts`.
- Keep sign-ups **off** and keep `.env.local` out of version control (already ignored).

## 14. Known limitations

- Aadhaar and account numbers are stored as plain text in the database (disk-encrypted by Supabase, but not column-encrypted).
- The Records, Payments and People lists have no pagination; Message History shows the latest 100.
- Message templates are edited in code, not on the Settings screen.
- Sign-in attempt limiting relies on Supabase's built-in protection.
- Search terms (a name or mobile number) appear in the page address.
- Overlapping scheduled runs could, very rarely, send the same reminder twice.
- Multi-record people show their most urgent status in the People list.
- One administrator role only; no staff accounts.
- MSG91 delivery has not been tested against a live account (see section 9).

## 15. Phase 2 ideas

PDF and Excel reports, charts, WhatsApp and email, editable templates stored in the database, staff users with roles, document uploads (Supabase Storage), audit log, notifications, column-level encryption for Aadhaar, pagination and filters on large lists, configurable reminder timing in Settings.
