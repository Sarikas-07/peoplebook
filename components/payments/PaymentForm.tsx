"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import type { PaymentFormState } from "@/app/(app)/payments/actions";
import { ErrorAlert } from "@/components/ui/Alert";
import { btnPrimary, btnSecondary, input } from "@/components/ui/styles";
import { formatINR } from "@/lib/format";
import { PAYMENT_METHODS } from "@/lib/validations/payment";

export type RecordOption = { id: string; label: string; remaining: number };

type Props = {
  action: (prev: PaymentFormState, fd: FormData) => Promise<PaymentFormState>;
  records: RecordOption[];
  defaultRecordId?: string;
  lockRecord?: boolean;
  defaultDate: string;
  cancelHref: string;
};

export default function PaymentForm({ action, records, defaultRecordId, lockRecord, defaultDate, cancelHref }: Props) {
  const [state, formAction, pending] = useActionState(action, {} as PaymentFormState);
  const [recordId, setRecordId] = useState(state.values?.record_id ?? defaultRecordId ?? "");
  const selected = records.find((r) => r.id === recordId);
  const val = (k: string, fallback = "") => state.values?.[k] ?? fallback;
  const err = (k: string) => state.fieldErrors?.[k as keyof typeof state.fieldErrors];
  const msg = (k: string) => err(k) && <span className="mt-1 block text-xs text-red-600">{err(k)}</span>;
  const label = "block text-sm font-medium text-slate-700";

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.error && <ErrorAlert>{state.error}</ErrorAlert>}

      {lockRecord && selected ? (
        <>
          <input type="hidden" name="record_id" value={selected.id} />
          <div className={label}>Record<p className="mt-1 text-base text-slate-900">{selected.label}</p></div>
        </>
      ) : (
        <label className={label}>
          Record *
          <select name="record_id" value={recordId} onChange={(e) => setRecordId(e.target.value)} className={input}>
            <option value="">Select a record</option>
            {records.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
          {msg("record_id")}
        </label>
      )}

      {selected && (
        <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">
          Remaining amount: <strong>{formatINR(selected.remaining)}</strong>
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={label}>
          Payment Amount (₹) *
          <input name="payment_amount" inputMode="decimal" defaultValue={val("payment_amount")} className={input} />
          {msg("payment_amount")}
        </label>
        <label className={label}>
          Payment Date *
          <input name="payment_date" type="date" defaultValue={val("payment_date", defaultDate)} className={input} />
          {msg("payment_date")}
        </label>
        <label className={label}>
          Payment Method *
          <select name="payment_method" defaultValue={val("payment_method", "Cash")} className={input}>
            {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          {msg("payment_method")}
        </label>
      </div>

      <label className={label}>
        Notes
        <textarea name="notes" rows={3} defaultValue={val("notes")} className={input} />
      </label>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending && <Loader2 size={16} className="animate-spin" />}
          {pending ? "Saving…" : "Record Payment"}
        </button>
        <Link href={cancelHref} className={btnSecondary}>Cancel</Link>
      </div>
    </form>
  );
}
