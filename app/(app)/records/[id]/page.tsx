import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageSquare, Pencil, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatINR } from "@/lib/format";
import { summarizeRecord } from "@/lib/calculations";
import StatusBadge from "@/components/ui/StatusBadge";
import { Flash } from "@/components/ui/Alert";
import { btnPrimary, btnSecondary, card, td, th } from "@/components/ui/styles";

type PaymentRow = {
  id: string; payment_amount: number; payment_date: string;
  payment_method: string; notes: string | null;
};

export default async function RecordPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; payment?: string }>;
}) {
  const { id } = await params;
  const { success, payment } = await searchParams;
  const supabase = await createClient();

  const { data } = await supabase
    .from("records")
    .select("id, person_id, amount_given, date_given, amount_due, due_date, notes, people(id, full_name, mobile_number), payments(id, payment_amount, payment_date, payment_method, notes, created_at)")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();

  const person = data.people as unknown as { id: string; full_name: string; mobile_number: string } | null;
  const payments = ((data.payments ?? []) as PaymentRow[]).sort((a, b) => b.payment_date.localeCompare(a.payment_date));
  const s = summarizeRecord({ ...data, payments });

  const rows: [string, string][] = [
    ["Amount Given", formatINR(data.amount_given)],
    ["Amount Due", formatINR(data.amount_due)],
    ["Amount Paid", formatINR(s.totalPaid)],
    ["Remaining Amount", formatINR(s.remaining)],
    ["Date Given", formatDate(data.date_given)],
    ["Due Date", formatDate(data.due_date)],
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl text-slate-900">Record</h1>
          {person && (
            <Link href={`/people/${person.id}`} className="text-sm text-blue-600 hover:underline">
              {person.full_name} · {person.mobile_number}
            </Link>
          )}
        </div>
        <Link href={`/records/${id}/edit`} className={btnSecondary}><Pencil size={16} /> Edit</Link>
      </div>

      <Flash code={success} />

      {success === "payment_added" && payment && person && payments.some((p) => p.id === payment) && (
        <div className={`${card} flex flex-wrap items-center justify-between gap-3`}>
          <div>
            <p className="font-medium text-slate-900">Send a payment confirmation?</p>
            <p className="text-sm text-slate-500">You can review and edit the message before it is sent.</p>
          </div>
          <Link href={`/messages?payment=${payment}`} className={btnPrimary}>
            <MessageSquare size={16} /> Send Payment Confirmation
          </Link>
        </div>
      )}

      <section className={card}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Summary</h2>
          <StatusBadge status={s.status} />
        </div>
        <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-3">
          {rows.map(([k, v]) => (
            <div key={k}><dt className="text-xs text-slate-500">{k}</dt><dd className="text-sm font-medium text-slate-900">{v}</dd></div>
          ))}
        </dl>
        {data.notes && <p className="mt-4 whitespace-pre-line border-t border-slate-100 pt-3 text-sm text-slate-600">{data.notes}</p>}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Payment History</h2>
          {s.remaining > 0 && (
            <Link href={`/payments/new?record=${id}`} className={btnPrimary}><Plus size={16} /> Add Payment</Link>
          )}
        </div>
        {payments.length === 0 ? (
          <div className={`${card} py-10 text-center text-slate-500`}>No payments found.</div>
        ) : (
          <div className={`${card} overflow-x-auto p-0`}>
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>{["Date", "Amount", "Method", "Notes"].map((h) => <th key={h} className={th}>{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className={td}>{formatDate(p.payment_date)}</td>
                    <td className={td}>{formatINR(p.payment_amount)}</td>
                    <td className={td}>{p.payment_method}</td>
                    <td className={td}>{p.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
