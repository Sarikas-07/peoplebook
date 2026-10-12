import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatINR } from "@/lib/format";
import { ErrorAlert } from "@/components/ui/Alert";
import { btnPrimary, card, td, th } from "@/components/ui/styles";

type Row = {
  id: string; record_id: string; payment_amount: number; payment_date: string;
  payment_method: string; notes: string | null;
  records: { amount_due: number; due_date: string; people: { full_name: string } | null } | null;
};

export default async function PaymentsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .select("id, record_id, payment_amount, payment_date, payment_method, notes, records(amount_due, due_date, people(full_name))")
    .order("payment_date", { ascending: false })
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as Row[];
  const recordLabel = (r: Row) => (r.records ? `${formatINR(r.records.amount_due)} · due ${formatDate(r.records.due_date)}` : "—");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl text-slate-900">Payments</h1>
        <Link href="/payments/new" className={btnPrimary}><Plus size={16} /> Add Payment</Link>
      </div>

      {error ? (
        <ErrorAlert>Unable to load payments.</ErrorAlert>
      ) : rows.length === 0 ? (
        <div className={`${card} py-12 text-center text-slate-500`}>No payments found.</div>
      ) : (
        <>
          <div className={`${card} hidden overflow-x-auto p-0 md:block`}>
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>{["Person", "Record", "Amount", "Date", "Method", "Notes"].map((h) => <th key={h} className={th}>{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td className={`${td} font-medium text-slate-900`}>{p.records?.people?.full_name ?? "—"}</td>
                    <td className={td}>
                      <Link href={`/records/${p.record_id}`} className="text-blue-600 hover:underline">{recordLabel(p)}</Link>
                    </td>
                    <td className={td}>{formatINR(p.payment_amount)}</td>
                    <td className={td}>{formatDate(p.payment_date)}</td>
                    <td className={td}>{p.payment_method}</td>
                    <td className={td}>{p.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 md:hidden">
            {rows.map((p) => (
              <div key={p.id} className={card}>
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-slate-900">{p.records?.people?.full_name ?? "—"}</p>
                  <p className="font-semibold text-slate-900">{formatINR(p.payment_amount)}</p>
                </div>
                <p className="mt-1 text-sm text-slate-500">{formatDate(p.payment_date)} · {p.payment_method}</p>
                <Link href={`/records/${p.record_id}`} className="mt-2 block text-sm text-blue-600 hover:underline">
                  Record: {recordLabel(p)}
                </Link>
                {p.notes && <p className="mt-2 text-sm text-slate-600">{p.notes}</p>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
