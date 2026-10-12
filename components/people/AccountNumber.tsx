"use client";

import { useEffect, useState, useTransition } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { revealAccountNumber } from "@/app/(app)/people/actions";

/** Shows "XXXXXX1234". The full number is fetched only when the eye is pressed, and hides again after 30 seconds. */
export default function AccountNumber({ personId, masked, hasValue }: { personId: string; masked: string; hasValue: boolean }) {
  const [value, setValue] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!value) return;
    const t = setTimeout(() => setValue(null), 30_000);
    return () => clearTimeout(t);
  }, [value]);

  if (!hasValue) return <span>—</span>;

  function toggle() {
    if (value) { setValue(null); return; }
    setError(null);
    startTransition(async () => {
      const r = await revealAccountNumber(personId);
      if (r.value) setValue(r.value);
      else setError(r.error ?? "Unable to show the account number.");
    });
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className="font-mono tracking-wider">{value ?? masked}</span>
      <button type="button" onClick={toggle} aria-pressed={Boolean(value)} disabled={pending}
        aria-label={value ? "Hide account number" : "Show account number"}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800">
        {pending ? <Loader2 size={16} className="animate-spin" /> : value ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </span>
  );
}
