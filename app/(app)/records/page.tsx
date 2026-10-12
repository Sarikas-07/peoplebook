import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { cleanSearchTerm } from "@/lib/search";
import { summarizeRecord } from "@/lib/calculations";
import RecordsList, { type RecordListRow } from "@/components/records/RecordsList";
import { ErrorAlert, Flash } from "@/components/ui/Alert";
import { btnPrimary, btnSecondary, card, input } from "@/components/ui/styles";

const FILTERS = ["All", "Active", "Overdue", "Paid"] as const;

export default async function RecordsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; success?: string }>;
}) {
  const { q = "", status = "All", success } = await searchParams;
  const filter = FILTERS.find((f) => f === status) ?? "All";
  const term = cleanSearchTerm(q);

  const supabase = await createClient();
  let query = supabase
    .from("records")
    .select("id, person_id, amount_given, date_given, amount_due, due_date, notes, payments(payment_amount), people!inner(full_name, mobile_number)")
    .order("due_date", { ascending: true });
  if (term) query = query.or(`full_name.ilike.%${term}%,mobile_number.ilike.%${term}%`, { referencedTable: "people" });

  const { data, error } = await query;
  const rows = ((data ?? []) as unknown as RecordListRow[])
    .map((r) => ({ r, s: summarizeRecord(r) }))
    .filter(({ s }) => filter === "All" || s.status === filter);

  const href = (f: string) => {
    const p = new URLSearchParams();
    if (term) p.set("q", term);
    if (f !== "All") p.set("status", f);
    const qs = p.toString();
    return qs ? `/records?${qs}` : "/records";
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl text-slate-900">Records</h1>
        <Link href="/records/new" className={btnPrimary}><Plus size={16} /> Add Record</Link>
      </div>

      <Flash code={success} />

      <form className="flex gap-2" role="search">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input name="q" defaultValue={q} placeholder="Search by person name or mobile number" className={`${input} mt-0 pl-9`} />
        </div>
        {filter !== "All" && <input type="hidden" name="status" value={filter} />}
        <button type="submit" className={btnPrimary}>Search</button>
        {q && <Link href={href("All").split("?")[0] + (filter !== "All" ? `?status=${filter}` : "")} className={btnSecondary}>Clear</Link>}
      </form>

      <div className="flex gap-2 overflow-x-auto">
        {FILTERS.map((f) => (
          <Link key={f} href={href(f)}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              f === filter ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`}>
            {f}
          </Link>
        ))}
      </div>

      {error ? (
        <ErrorAlert>Unable to load records.</ErrorAlert>
      ) : rows.length === 0 ? (
        <div className={`${card} py-12 text-center text-slate-500`}>No records found.</div>
      ) : (
        <RecordsList rows={rows} />
      )}
    </div>
  );
}
