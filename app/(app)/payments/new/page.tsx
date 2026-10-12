import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatINR } from "@/lib/format";
import { calculateRemaining, calculateTotalPaid, todayIST } from "@/lib/calculations";
import PaymentForm, { type RecordOption } from "@/components/payments/PaymentForm";
import { ErrorAlert } from "@/components/ui/Alert";
import { btnSecondary, card } from "@/components/ui/styles";
import { createPayment } from "../actions";

type Row = {
  id: string; amount_due: number; due_date: string;
  payments: { payment_amount: number }[] | null;
  people: { full_name: string } | null;
};

export default async function NewPaymentPage({ searchParams }: { searchParams: Promise<{ record?: string }> }) {
  const { record } = await searchParams;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("records")
    .select("id, amount_due, due_date, payments(payment_amount), people(full_name)")
    .order("due_date");

  const options: RecordOption[] = ((data ?? []) as unknown as Row[])
    .map((r) => {
      const remaining = calculateRemaining(r.amount_due, calculateTotalPaid(r.payments));
      return {
        id: r.id,
        remaining,
        label: `${r.people?.full_name ?? "—"} · Due ${formatINR(r.amount_due)} · Remaining ${formatINR(remaining)} · ${formatDate(r.due_date)}`,
      };
    })
    .filter((o) => o.remaining > 0);

  const requestedFullyPaid = record && !options.some((o) => o.id === record);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-3xl text-slate-900">Add Payment</h1>
      <div className={card}>
        {error ? (
          <ErrorAlert>Unable to load records.</ErrorAlert>
        ) : requestedFullyPaid ? (
          <div className="space-y-4">
            <p className="text-slate-600">This record is already fully paid.</p>
            <Link href={`/records/${record}`} className={btnSecondary}>Back to record</Link>
          </div>
        ) : options.length === 0 ? (
          <p className="text-slate-500">No records found with a remaining amount.</p>
        ) : (
          <PaymentForm
            action={createPayment}
            records={options}
            defaultRecordId={record}
            lockRecord={Boolean(record)}
            defaultDate={todayIST()}
            cancelHref={record ? `/records/${record}` : "/payments"}
          />
        )}
      </div>
    </div>
  );
}
