import Link from "next/link";
import { Activity, AlertTriangle, CalendarClock, CheckCircle2, FilePlus2, HandCoins, Hourglass, IndianRupee, MessageSquare, UserPlus, Users, Wallet, type LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatINR } from "@/lib/format";
import { summarizePortfolio, summarizeRecord } from "@/lib/calculations";
import StatCard from "@/components/dashboard/StatCard";
import { ErrorAlert } from "@/components/ui/Alert";
import { card } from "@/components/ui/styles";
import type { RecordRow } from "@/types";

type DashRecord = RecordRow & { people: { full_name: string } | null };
type DashPayment = {
  id: string; record_id: string; payment_amount: number; payment_date: string; payment_method: string;
  records: { people: { full_name: string } | null } | null;
};

const QUICK: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/people/new", label: "Add Person", icon: UserPlus },
  { href: "/records/new", label: "Add Record", icon: FilePlus2 },
  { href: "/payments/new", label: "Add Payment", icon: IndianRupee },
  { href: "/messages", label: "Send Message", icon: MessageSquare },
];

function Section({ title, empty, icon: Icon, tone, children }: { title: string; empty: string; icon: LucideIcon; tone: string; children: React.ReactNode[] }) {
  return (
    <section className={card}>
      <h2 className="mb-3 flex items-center gap-2.5 text-lg text-slate-900">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}><Icon size={16} /></span> {title}
      </h2>
      {children.length === 0 ? <p className="py-6 text-center text-sm text-slate-500">{empty}</p>
        : <ul className="divide-y divide-slate-100">{children}</ul>}
    </section>
  );
}

const rowClass = "flex items-center justify-between gap-3 py-3 hover:bg-slate-50 -mx-2 px-2 rounded-lg";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [people, records, payments] = await Promise.all([
    supabase.from("people").select("id", { count: "exact", head: true }).eq("is_archived", false),
    supabase
      .from("records")
      .select("id, person_id, amount_given, date_given, amount_due, due_date, notes, payments(payment_amount), people(full_name)"),
    supabase
      .from("payments")
      .select("id, record_id, payment_amount, payment_date, payment_method, records(people(full_name))")
      .order("payment_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  if (people.error || records.error || payments.error) {
    return (
      <div className="space-y-5">
        <h1 className="text-3xl text-slate-900">Dashboard</h1>
        <ErrorAlert>Unable to load dashboard data.</ErrorAlert>
      </div>
    );
  }

  const all = (records.data ?? []) as unknown as DashRecord[];
  const stats = summarizePortfolio(all);
  const withStatus = all.map((r) => ({ r, s: summarizeRecord(r) }));
  const byDue = (a: { r: DashRecord }, b: { r: DashRecord }) => a.r.due_date.localeCompare(b.r.due_date);
  const upcoming = withStatus.filter((x) => x.s.status === "Active").sort(byDue).slice(0, 5);
  const overdue = withStatus.filter((x) => x.s.status === "Overdue").sort(byDue).slice(0, 5);
  const hour = Number(new Date().toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }));
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const recent = (payments.data ?? []) as unknown as DashPayment[];

  const recordRow = ({ r, s }: { r: DashRecord; s: ReturnType<typeof summarizeRecord> }, dueClass: string) => (
    <li key={r.id}>
      <Link href={`/records/${r.id}`} className={rowClass}>
        <div>
          <p className="text-sm font-medium text-slate-900">{r.people?.full_name ?? "—"}</p>
          <p className={`text-xs ${dueClass}`}>Due {formatDate(r.due_date)}</p>
        </div>
        <p className="text-sm font-medium text-slate-900">{formatINR(s.remaining)}</p>
      </Link>
    </li>
  );

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0d1833] via-[#15337a] to-blue-700 p-6 text-white shadow-xl shadow-blue-900/20 sm:p-8">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 animate-sheen rounded-full bg-white/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "repeating-linear-gradient(to bottom, transparent 0, transparent 31px, white 31px, white 32px)" }} />
        <div className="relative">
          <p className="text-sm text-blue-100/80">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" })}
          </p>
          <h1 className="mt-1 text-3xl text-white sm:text-4xl">{greeting}</h1>
          <p className="mt-1 text-blue-100/80">Here is a summary of your people, records and payments.</p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            {QUICK.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white/12 px-4 text-sm font-medium text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/25 active:scale-[0.98]">
                <Icon size={16} /> {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total People" value={people.count ?? 0} icon={Users} />
        <StatCard label="Total Amount Given" value={formatINR(stats.given)} icon={HandCoins} />
        <StatCard label="Total Amount Due" value={formatINR(stats.due)} icon={CalendarClock} />
        <StatCard label="Total Amount Received" value={formatINR(stats.received)} tone="green" icon={Wallet} />
        <StatCard label="Total Remaining" value={formatINR(stats.remaining)} tone="blue" icon={Hourglass} />
        <StatCard label="Active Records" value={stats.activeRecords} icon={Activity} />
        <StatCard label="Overdue Records" value={stats.overdueRecords} tone="red" icon={AlertTriangle} />
        <StatCard label="Paid Records" value={stats.paidRecords} tone="green" icon={CheckCircle2} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Section title="Upcoming Due" empty="No upcoming due dates." icon={CalendarClock} tone="bg-blue-50 text-blue-700">
          {upcoming.map((x) => recordRow(x, "text-slate-500"))}
        </Section>
        <Section title="Overdue" empty="Nothing overdue." icon={AlertTriangle} tone="bg-red-50 text-red-700">
          {overdue.map((x) => recordRow(x, "text-red-600"))}
        </Section>
        <Section title="Recent Payments" empty="No payments found." icon={Wallet} tone="bg-emerald-50 text-emerald-700">
          {recent.map((p) => (
            <li key={p.id}>
              <Link href={`/records/${p.record_id}`} className={rowClass}>
                <div>
                  <p className="text-sm font-medium text-slate-900">{p.records?.people?.full_name ?? "—"}</p>
                  <p className="text-xs text-slate-500">{formatDate(p.payment_date)} · {p.payment_method}</p>
                </div>
                <p className="text-sm font-medium text-green-600">{formatINR(p.payment_amount)}</p>
              </Link>
            </li>
          ))}
        </Section>
      </div>
    </div>
  );
}
