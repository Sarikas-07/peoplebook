"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import type { PersonFormState } from "@/app/(app)/people/actions";
import { ErrorAlert } from "@/components/ui/Alert";
import { btnPrimary, btnSecondary, input } from "@/components/ui/styles";

type Initial = {
  full_name?: string; address?: string | null; mobile_number?: string;
  alternative_mobile_number?: string | null; notes?: string | null;
  branch_name?: string | null; branch_location?: string | null;
};

type Props = {
  action: (prev: PersonFormState, fd: FormData) => Promise<PersonFormState>;
  initial?: Initial;
  cancelHref: string;
  submitLabel: string;
  /** Masked Aadhaar (e.g. "XXXX XXXX 1234") when one is already stored (edit mode). */
  aadhaarMasked?: string | null;
  /** Masked account number (e.g. "XXXXXX1234") when one is already stored (edit mode). */
  accountMasked?: string | null;
};

export default function PersonForm({ action, initial = {}, cancelHref, submitLabel, aadhaarMasked, accountMasked }: Props) {
  const [state, formAction, pending] = useActionState(action, {} as PersonFormState);
  const val = (k: keyof Initial) => state.values?.[k] ?? initial[k] ?? "";
  const err = (k: string) => state.fieldErrors?.[k as keyof typeof state.fieldErrors];

  const field = ({ name, label, required, type = "text", mode, textarea }: {
    name: keyof Initial | "aadhaar_number" | "account_number"; label: string; required?: boolean; type?: string;
    mode?: "numeric" | "tel"; textarea?: boolean;
  }) => (
    <label className="block text-sm font-medium text-slate-700">
      {label}{required && " *"}
      {textarea ? (
        <textarea name={name} rows={3} defaultValue={val(name as keyof Initial)} className={input} />
      ) : (
        <input
          name={name} type={type} inputMode={mode} required={required}
          defaultValue={name === "aadhaar_number" ? "" : name === "account_number" ? (state.values?.account_number ?? "") : val(name as keyof Initial)}
          placeholder={name === "aadhaar_number" && aadhaarMasked ? `${aadhaarMasked} (leave blank to keep)` : name === "account_number" && accountMasked ? `${accountMasked} (leave blank to keep)` : undefined}
          autoComplete="off" className={input}
        />
      )}
      {err(name) && <span className="mt-1 block text-xs text-red-600">{err(name)}</span>}
    </label>
  );

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.error && <ErrorAlert>{state.error}</ErrorAlert>}
      <div className="grid gap-4 sm:grid-cols-2">
        {field({ name: "full_name", label: "Full Name", required: true })}
        {field({ name: "mobile_number", label: "Mobile Number", required: true, type: "tel", mode: "tel" })}
        {field({ name: "alternative_mobile_number", label: "Alternative Mobile Number", type: "tel", mode: "tel" })}
        {field({ name: "aadhaar_number", label: "Aadhaar Number", mode: "numeric" })}
      </div>
      {aadhaarMasked && (
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" name="remove_aadhaar" className="h-4 w-4" /> Remove stored Aadhaar number
        </label>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {field({ name: "branch_name", label: "Branch Name" })}
        {field({ name: "branch_location", label: "Branch Location" })}
        {field({ name: "account_number", label: "Account Number", mode: "numeric" })}
      </div>
      {accountMasked && (
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" name="remove_account_number" className="h-4 w-4" /> Remove stored account number
        </label>
      )}
      {field({ name: "address", label: "Address", textarea: true })}
      {field({ name: "notes", label: "Notes", textarea: true })}
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
