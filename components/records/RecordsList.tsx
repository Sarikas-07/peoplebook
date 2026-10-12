import Link from "next/link";
import { formatDate, formatINR } from "@/lib/format";
import { summarizeRecord } from "@/lib/calculations";
import StatusBadge from "@/components/ui/StatusBadge";
import { card, td, th } from "@/components/ui/styles";
import type { RecordRow } from "@/types";

export type RecordListRow = RecordRow & {
  people: { full_name: string; mobile_number: string } | null;
};

const link = "text-sm font-medium text-blue-600 hover:underline";
const tapLink = "inline-flex min-h-11 items-center text-sm font-medium text-blue-600 hover:underline";

export default function RecordsList({ rows }: { rows: { r: RecordListRow; s: ReturnType<typeof summarizeRecord> }[] }) {
  return (
    <>
      <div className={`${card} hidden overflow-x-auto p-0 xl:block`}>
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              {["Person", "Amount Given", "Amount Due", "Amount Paid", "Remaining", "Date Given", "Due Date", "Status", "Actions"].map((h) => (
                <th key={h} className={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(({ r, s }) => (
              <tr key={r.id}>
                <td className={`${td} font-medium text-slate-900`}>{r.people?.full_name ?? "—"}</td>
                <td className={td}>{formatINR(r.amount_given)}</td>
                <td className={td}>{formatINR(r.amount_due)}</td>
                <td className={td}>{formatINR(s.totalPaid)}</td>
                <td className={td}>{formatINR(s.remaining)}</td>
                <td className={td}>{formatDate(r.date_given)}</td>
                <td className={td}>{formatDate(r.due_date)}</td>
                <td className={td}><StatusBadge status={s.status} /></td>
                <td className={td}>
                  <div className="flex gap-3">
                    <Link href={`/records/${r.id}`} className={link}>View</Link>
                    <Link href={`/records/${r.id}/edit`} className={link}>Edit</Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:hidden">
        {rows.map(({ r, s }) => (
          <div key={r.id} className={card}>
            <div className="flex items-start justify-between gap-3">
              <p className="break-words font-medium text-slate-900">{r.people?.full_name ?? "—"}</p>
              <StatusBadge status={s.status} />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div><dt className="text-slate-500">Amount Given</dt><dd>{formatINR(r.amount_given)}</dd></div>
              <div><dt className="text-slate-500">Amount Due</dt><dd>{formatINR(r.amount_due)}</dd></div>
              <div><dt className="text-slate-500">Amount Paid</dt><dd>{formatINR(s.totalPaid)}</dd></div>
              <div><dt className="text-slate-500">Remaining</dt><dd className="font-medium">{formatINR(s.remaining)}</dd></div>
              <div><dt className="text-slate-500">Date Given</dt><dd>{formatDate(r.date_given)}</dd></div>
              <div><dt className="text-slate-500">Due Date</dt><dd>{formatDate(r.due_date)}</dd></div>
            </dl>
            <div className="mt-3 flex gap-5 border-t border-slate-100 pt-1">
              <Link href={`/records/${r.id}`} className={tapLink}>View</Link>
              <Link href={`/records/${r.id}/edit`} className={tapLink}>Edit</Link>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
