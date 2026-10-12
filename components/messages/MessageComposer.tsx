"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { CheckCircle2, Info, Loader2, Send } from "lucide-react";
import type { MessageFormState } from "@/app/(app)/messages/actions";
import { ErrorAlert } from "@/components/ui/Alert";
import { btnPrimary, input } from "@/components/ui/styles";
import { DEFAULT_TEMPLATES, MESSAGE_TYPES, renderTemplate, type MessageType } from "@/lib/sms/templates";
import { MAX_MESSAGE_LENGTH } from "@/lib/validations/message";

export type ComposerRecord = {
  id: string; label: string; totalPaid: number; remaining: number;
  dueDate: string; lastPayment: number | null;
};
export type ComposerPerson = { id: string; name: string; mobile: string; records: ComposerRecord[] };

type Props = {
  action: (prev: MessageFormState, fd: FormData) => Promise<MessageFormState>;
  people: ComposerPerson[];
  configured: boolean;
  /** Optional pre-filled state, e.g. the payment confirmation opened after recording a payment. */
  initial?: { personId: string; recordId: string; type: MessageType; text: string };
};

function pickRecord(p: ComposerPerson | undefined) {
  return p?.records.find((r) => r.remaining > 0)?.id ?? p?.records[0]?.id ?? "";
}

function buildText(p: ComposerPerson | undefined, recordId: string, type: MessageType) {
  if (!p || type === "custom") return "";
  const r = p.records.find((x) => x.id === recordId);
  if (!r) return "";
  return renderTemplate(DEFAULT_TEMPLATES[type], {
    person_name: p.name, payment_amount: r.lastPayment, total_paid: r.totalPaid,
    remaining_amount: r.remaining, due_date: r.dueDate,
  });
}

export default function MessageComposer({ action, people, configured, initial }: Props) {
  const [state, formAction, pending] = useActionState(action, {} as MessageFormState);
  const [personId, setPersonId] = useState(initial?.personId ?? "");
  const [recordId, setRecordId] = useState(initial?.recordId ?? "");
  const [type, setType] = useState<MessageType>(initial?.type ?? "upcoming_reminder");
  const [text, setText] = useState(initial?.text ?? "");

  const feedbackRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.success || state.error) feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [state]);

  const person = people.find((p) => p.id === personId);
  const label = "block text-sm font-medium text-slate-700";
  const err = (k: string) => state.fieldErrors?.[k as keyof typeof state.fieldErrors];
  const needsRecord = type !== "custom";
  const noRecords = needsRecord && person && person.records.length === 0;

  function changePerson(id: string) {
    const p = people.find((x) => x.id === id);
    const rid = pickRecord(p);
    setPersonId(id); setRecordId(rid); setText(buildText(p, rid, type));
  }
  function changeRecord(rid: string) { setRecordId(rid); setText(buildText(person, rid, type)); }
  function changeType(t: MessageType) { setType(t); setText(buildText(person, recordId, t)); }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {!configured && (
        <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
          <Info size={16} className="mt-0.5 shrink-0" />
          <span>SMS service is not configured. Messages cannot be sent until it is set up (see Settings).</span>
        </p>
      )}
      <div ref={feedbackRef}>
        {state.error && <ErrorAlert>{state.error}</ErrorAlert>}
        {state.success && (
          <p role="status" className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-800 ring-1 ring-green-200">
            <CheckCircle2 size={18} className="shrink-0" /> {state.success}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={label}>
          Person *
          <select name="person_id" value={personId} onChange={(e) => changePerson(e.target.value)} className={input}>
            <option value="">Select a person</option>
            {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {err("person_id") && <span className="mt-1 block text-xs text-red-600">{err("person_id")}</span>}
        </label>
        <div className={label}>
          Mobile Number
          <p className={`${input} bg-slate-50 text-slate-700`}>{person?.mobile ?? "—"}</p>
        </div>
        <label className={label}>
          Message Type *
          <select name="message_type" value={type} onChange={(e) => changeType(e.target.value as MessageType)} className={input}>
            {MESSAGE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </label>
        {needsRecord && person && person.records.length > 0 && (
          <label className={label}>
            Record
            <select name="record_id" value={recordId} onChange={(e) => changeRecord(e.target.value)} className={input}>
              {person.records.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </label>
        )}
      </div>

      {noRecords && <p className="text-sm text-amber-700">This person has no records, so templates can&apos;t be filled in. Use a Custom Message instead.</p>}
      {type === "payment_confirmation" && person && recordId && !person.records.find((r) => r.id === recordId)?.lastPayment && (
        <p className="text-sm text-amber-700">This record has no payments yet, so the payment amount is left blank.</p>
      )}

      <label className={label}>
        Message *
        <textarea name="message_text" rows={8} value={text} onChange={(e) => setText(e.target.value)} className={input} />
        <span className="mt-1 flex justify-between text-xs text-slate-500">
          <span className="text-red-600">{err("message_text")}</span>
          <span>{text.length}/{MAX_MESSAGE_LENGTH}</span>
        </span>
      </label>

      <button type="submit" disabled={pending || !configured || !personId || !text.trim()} className={btnPrimary}>
        {pending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        {pending ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}
