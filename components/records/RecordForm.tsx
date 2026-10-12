"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import type { RecordFormState } from "@/app/(app)/records/actions";
import { ErrorAlert } from "@/components/ui/Alert";
import { btnPrimary, btnSecondary, input } from "@/components/ui/styles";

type Initial = {
  person_id?: string; amount_given?: string | number; date_given?: string;
  amount_due?: string | number; due_date?: string; notes?: string | null;
};
type PersonOption = { id: string; full_name: string; mobile_number: string };

type Props = {
  action: (prev: RecordFormState, fd: FormData) => Promise<RecordFormState>;
  people?: PersonOption[];        // create mode: choices for the Person field
  lockedPersonName?: string;      // edit mode: person is fixed
  initial?: Initial;
  cancelHref: string;
  submitLabel: string;
};

export default function RecordForm({ action, people, lockedPersonName, initial = {}, cancelHref, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, {} as RecordFormState);
  const val = (k: keyof Initial) => String(state.values?.[k] ?? initial[k] ?? "");
  const err = (k: string) => state.fieldErrors?.[k as keyof typeof state.fieldErrors];
  const msg = (k: string) => err(k) && <span className="mt-1 block text-xs text-red-600">{err(k)}</span>;

  const label = "block text-sm font-medium text-slate-700";

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.error && <ErrorAlert>{state.error}</ErrorAlert>}

      {lockedPersonName ? (
        <div className={label}>Person<p className="mt-1 text-base text-slate-900">{lockedPersonName}</p></div>
      ) : (
        <label className={label}>
          Person *
          <select name="person_id" defaultValue={val("person_id")} className={input}>
            <option value="">Select a person</option>
            {people?.map((p) => (
              <option key={p.id} value={p.id}>{p.full_name} — {p.mobile_number}</option>
            ))}
          </select>
          {msg("person_id")}
        </label>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={label}>
          Amount Given (₹) *
          <input name="amount_given" inputMode="decimal" defaultValue={val("amount_given")} className={input} />
          {msg("amount_given")}
        </label>
        <label className={label}>
          Date Given *
          <input name="date_given" type="date" defaultValue={val("date_given")} className={input} />
          {msg("date_given")}
        </label>
        <label className={label}>
          Amount Due (₹) *
          <input name="amount_due" inputMode="decimal" defaultValue={val("amount_due")} className={input} />
          {msg("amount_due")}
        </label>
        <label className={label}>
          Due Date *
          <input name="due_date" type="date" defaultValue={val("due_date")} className={input} />
          {msg("due_date")}
        </label>
      </div>

      <label className={label}>
        Notes
        <textarea name="notes" rows={3} defaultValue={val("notes")} className={input} />
      </label>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending && <Loader2 size={16} className="animate-spin" />}
          {pending ? "Saving…" : submitLabel}
        </button>
        <Link href={cancelHref} className={btnSecondary}>Cancel</Link>
      </div>
    </form>
  );
}
