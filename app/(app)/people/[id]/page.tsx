import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatINR, maskAadhaar, maskAccountNumber } from "@/lib/format";
import AccountNumber from "@/components/people/AccountNumber";
import { summarizeRecord } from "@/lib/calculations";
import StatusBadge from "@/components/ui/StatusBadge";
import ArchiveButton from "@/components/people/ArchiveButton";
import { Flash } from "@/components/ui/Alert";
import { btnPrimary, btnSecondary, card } from "@/components/ui/styles";
import type { RecordRow } from "@/types";

export default async function PersonPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string }>;
}) {
  const { id } = await params;
  const { success } = await searchParams;
  const supabase = await createClient();

  const { data } = await supabase
    .from("people")
    .select("id, full_name, address, mobile_number, alternative_mobile_number, aadhaar_number, notes, is_archived, branch_name, branch_location, account_number, records(id, person_id, amount_given, date_given, amount_due, due_date, notes, payments(payment_amount))")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();

  const records = ((data.records ?? []) as RecordRow[]).sort((a, b) => b.date_given.localeCompare(a.date_given));
  const info: [string, string][] = [
    ["Name", data.full_name],
    ["Address", data.address || "—"],
    ["Mobile", data.mobile_number],
    ["Alternative Mobile", data.alternative_mobile_number || "—"],
    ["Aadhaar", maskAadhaar(data.aadhaar_number)], // only the masked value leaves the server
    ["Branch Name", data.branch_name || "—"],
    ["Branch Location", data.branch_location || "—"],
    ["Notes", data.notes || "—"],
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl text-slate-900">
          {data.full_name}
          {data.is_archived && <span className="ml-3 text-sm font-normal text-slate-500">Archived</span>}
        </h1>
        <div className="flex items-center gap-3">
          <Link href={`/people/${id}/edit`} className={btnSecondary}><Pencil size={16} /> Edit</Link>
          {!data.is_archived && <ArchiveButton id={id} />}
        </div>
      </div>

      <Flash code={success} />

      <section className={card}>
        <h2 className="mb-4 font-semibold text-slate-900">Person Information</h2>
        <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {info.map(([k, v]) => (
            <div key={k}><dt className="text-xs text-slate-500">{k}</dt><dd className="whitespace-pre-line text-sm text-slate-900">{v}</dd></div>
          ))}
          <div>
            <dt className="text-xs text-slate-500">Account Number</dt>
            <dd className="text-sm text-slate-900">
              <AccountNumber personId={id} masked={maskAccountNumber(data.account_number)} hasValue={Boolean(data.account_number)} />
            </dd>
          </div>
        </dl>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Record Summary</h2>
          <Link href={`/records/new?person=${id}`} className={btnPrimary}><Plus size={16} /> Add Record</Link>
        </div>
        {records.length === 0 ? (
          <div className={`${card} py-10 text-center text-slate-500`}>No records found.</div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {records.map((r) => {
              const s = summarizeRecord(r);
              const rows: [string, string][] = [
                ["Amount Given", formatINR(r.amount_given)],
                ["Amount Due", formatINR(r.amount_due)],
                ["Amount Paid", formatINR(s.totalPaid)],
                ["Remaining", formatINR(s.remaining)],
                ["Date Given", formatDate(r.date_given)],
                ["Due Date", formatDate(r.due_date)],
              ];
              return (
                <div key={r.id} className={card}>
                  <div className="mb-3 flex items-center justify-between">
                    <StatusBadge status={s.status} />
                    <Link href={`/records/${r.id}`} className="text-sm font-medium text-blue-600 hover:underline">View</Link>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    {rows.map(([k, v]) => (
                      <div key={k}><dt className="text-slate-500">{k}</dt><dd className="text-slate-900">{v}</dd></div>
                    ))}
                  </dl>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
