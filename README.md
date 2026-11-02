 # PeopleBook – Diamond Elite Club

*Simple. Secure. Organized.*

**Live Application:** https://peoplebook-git-branding-diamond-elite-club-sarika-s.vercel.app/login

## 1. Project Overview

PeopleBook is a private, admin-only web application developed for Diamond Elite Club to securely manage people's information and their financial records in one organized platform.

The application is designed around a specific requirement: **only an authorized administrator can access, manage, and maintain the saved records.** It is not a public record-sharing platform, and ordinary visitors cannot access private information or perform administrative operations.

The application helps the administrator manage:

- **People:** Store and manage personal information.
- **Records:** Maintain financial records associated with each person.
- **Payments:** Record payments received against individual records.
- **Reports:** View financial summaries and export filtered reports.
- **Messages:** Prepare and send SMS notifications and payment confirmations.
- **Reminders:** Support automated upcoming-due and overdue reminders.

### Key Features

- Private administrator login with role-based access.
- Centralized storage of people's information and financial records.
- Payment tracking with automatically calculated remaining balances.
- Automatic record status calculation:
  - **Active:** Payment is pending and the due date has not passed.
  - **Overdue:** The due date has passed and an amount remains.
  - **Paid:** No remaining amount is due.
- SMS payment confirmations and reminder support through MSG91.
- Search, filtering, reports, and CSV export.
- Archive functionality to preserve historical records.
- Responsive web application accessible through a browser.

Remaining amounts and statuses are calculated from actual payments rather than manually entered or stored.

Amounts are displayed in Indian currency format (₹1,50,000), and dates use formats such as `15 Sep 2026`.

The application name and branding are centrally configurable through `lib/constants.ts` and the relevant UI components.

## 2. Technology Stack

| Technology | Purpose |
|---|---|
| Next.js 16 | Full-stack web application and routing |
| React 19 | User interface development |
| TypeScript | Type safety and application logic |
| Tailwind CSS | Responsive UI styling |
| Supabase | Backend services and database integration |
| PostgreSQL | Structured data storage |
| Supabase Auth | Administrator authentication |
| Row Level Security (RLS) | Database-level access control |
| Lucide Icons | UI icons |
| MSG91 | SMS integration |
| Vercel | Application hosting and deployment |
| Git & GitHub | Version control and source management |

## 3. Application Architecture and Workflow

The application follows a client-server-database architecture.

### Application Flow

1. **Administrator Login:** The administrator accesses the application through the login page.
2. **Authentication:** Supabase Auth verifies the login credentials.
3. **Role Verification:** The application checks whether the authenticated account has the authorized administrator role.
4. **Protected Dashboard:** Authorized administrators can access the dashboard and management modules.
5. **Data Management:** The administrator adds and manages people, financial records, and payments.
6. **Database Storage:** Data is stored in a PostgreSQL database hosted by Supabase.
7. **Business Logic:** Remaining balances, payment status, due dates, and reports are calculated using application logic and database rules.
8. **Communication:** The administrator can use SMS functionality for payment confirmations and reminders.
9. **Logout:** The administrator can securely end the session.

### Simplified Architecture

```text
          Administrator
                 |
                 v
          Login Interface
                 |
                 v
          Supabase Auth
                 |
                 v
          Admin Role Check
                 |
          +------+------+
          |             |
       Authorized    Unauthorized
          |             |
          v             v
       Dashboard     Login / Denied
          |
          v
   People & Records
          |
          v
   Payments & Reports
          |
          v
     Business Logic
          |
          v
   Supabase PostgreSQL
          |
          v
   Secure Data Storage

   SMS Integration: MSG91
   Hosting: Vercel
```

## 4. Installation

### Requirements

- Node.js 20.9 or newer.
- npm.
- A Supabase project.
- Git.

Clone the repository:

```bash
git clone https://github.com/Sarikas-07/peoplebook.git
cd peoplebook
```

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.local.example .env.local
```

Configure the environment variables described in Section 5.

Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## 5. Environment Variables

Create a `.env.local` file in the project root.

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable/anonymous key used by the application |
| `SMS_PROVIDER` | SMS gateway provider, currently `msg91` |
| `SMS_API_KEY` | Server-side SMS authentication |
| `SMS_SENDER_ID` | SMS sender ID |
| `SMS_TEMPLATE_ID` | Approved SMS template ID |
| `SMS_TEMPLATE_VARIABLE` | Optional SMS template variable; defaults to `VAR1` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side automatic reminder operations |
| `CRON_SECRET` | Secret used to protect scheduled reminder requests |
| `AUTO_REMINDERS_ENABLED` | Enables automatic reminders only when set to `true` |
| `REMINDER_UPCOMING_DAYS` | Optional upcoming reminder window |
| `REMINDER_OVERDUE_REPEAT_DAYS` | Optional overdue reminder interval |
| `REMINDER_MAX_PER_RUN` | Optional maximum messages per scheduled run |

The application requires the first two Supabase variables for its core functionality. SMS and automatic reminder variables are optional.

**Security:** Never commit `.env.local`, passwords, API keys, or service-role credentials to GitHub. Use Vercel Environment Variables for deployment configuration.

## 6. Supabase Setup

1. Create a project at [Supabase](https://supabase.com/).
2. Open Project Settings → API.
