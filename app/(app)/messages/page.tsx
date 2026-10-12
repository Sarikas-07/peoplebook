import { createClient } from "@/lib/supabase/server";
import { formatDate, formatINR } from "@/lib/format";
import { summarizeRecord } from "@/lib/calculations";
import { isSmsConfigured } from "@/lib/sms/service";
import { DEFAULT_TEMPLATES, renderTemplate } from "@/lib/sms/templates";
import MessageComposer, { type ComposerPerson } from "@/components/messages/MessageComposer";
import MessageHistory, { type MessageRow } from "@/components/messages/MessageHistory";
import { ErrorAlert } from "@/components/ui/Alert";
import { card } from "@/components/ui/styles";
import type { RecordRow } from "@/types";
import { sendMessage } from "./actions";

const HISTORY_LIMIT = 100;

type PaymentRow = { id: string; payment_amount: number; payment_date: string; created_at: string };
type PersonRow = {
  id: string; full_name: string; mobile_number: string;
  records: (Omit<RecordRow, "payments"> & { payments: PaymentRow[] | null })[] | null;
};

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ payment?: string }> }) {
  const { payment: paymentId } = await searchParams;
  const supabase = await createClient();
  const [people, history] = await Promise.all([
    supabase
      .from("people")
      .select("id, full_name, mobile_number, records(id, person_id, amount_given, date_given, amount_due, due_date, notes, payments(id, payment_amount, payment_date, created_at))")
      .eq("is_archived", false)
      .order("full_name"),
    supabase
      .from("messages")
      .select("id, message_text, message_type, recipient_mobile, status, created_at, people(full_name)")
      .order("created_at", { ascending: false })
      .limit(HISTORY_LIMIT),
  ]);

  // Remember which person/record/amount a given payment belongs to (for ?payment=<id>).
  const paymentLookup = new Map<string, { personId: string; recordId: string; amount: number }>();

  const composerPeople: ComposerPerson[] = ((people.data ?? []) as unknown as PersonRow[]).map((p) => ({
    id: p.id,
    name: p.full_name,
    mobile: p.mobile_number,
    records: (p.records ?? [])
      .sort((a, b) => a.due_date.localeCompare(b.due_date))
      .map((r) => {
        const s = summarizeRecord(r);
        for (const pay of r.payments ?? []) {
          paymentLookup.set(pay.id, { personId: p.id, recordId: r.id, amount: Number(pay.payment_amount) });
        }
        const last = [...(r.payments ?? [])].sort((a, b) =>
          (b.payment_date + b.created_at).localeCompare(a.payment_date + a.created_at))[0];
        return {
          id: r.id,
          label: `${formatINR(r.amount_due)} · due ${formatDate(r.due_date)} · ${s.status}`,
          totalPaid: s.totalPaid,
          remaining: s.remaining,
          dueDate: formatDate(r.due_date),
          lastPayment: last ? Number(last.payment_amount) : null,
        };
      }),
  }));

  // Payment confirmation for one specific payment, ready for the admin to review and edit.
  let initial: Parameters<typeof MessageComposer>[0]["initial"];
  const hit = paymentId ? paymentLookup.get(paymentId) : undefined;
  if (hit) {
    const person = composerPeople.find((p) => p.id === hit.personId);
    const record = person?.records.find((r) => r.id === hit.recordId);
    if (person && record) {
      initial = {
        personId: person.id,
        recordId: record.id,
        type: "payment_confirmation",
        text: renderTemplate(DEFAULT_TEMPLATES.payment_confirmation, {
          person_name: person.name, payment_amount: hit.amount,
          total_paid: record.totalPaid, remaining_amount: record.remaining, due_date: record.dueDate,
        }),
      };
    }
  }

  const rows = (history.data ?? []) as unknown as MessageRow[];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl text-slate-900">Messages</h1>

      <section className={card}>
        <h2 className="mb-4 font-semibold text-slate-900">Send Message</h2>
        {people.error ? (
          <ErrorAlert>Unable to load people.</ErrorAlert>
        ) : (
          <MessageComposer action={sendMessage} people={composerPeople} configured={isSmsConfigured()} initial={initial} />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-slate-900">Message History</h2>
        {history.error ? (
          <ErrorAlert>Unable to load message history.</ErrorAlert>
        ) : rows.length === 0 ? (
          <div className={`${card} py-10 text-center text-slate-500`}>No messages found.</div>
        ) : (
          <>
            <MessageHistory rows={rows} />
            {rows.length === HISTORY_LIMIT && (
              <p className="text-center text-xs text-slate-500">Showing the latest {HISTORY_LIMIT} messages.</p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
