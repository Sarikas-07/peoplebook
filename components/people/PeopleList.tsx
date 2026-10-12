import Link from "next/link";
import { formatINR } from "@/lib/format";
import { summarizeRecords } from "@/lib/calculations";
import StatusBadge from "@/components/ui/StatusBadge";
import ArchiveButton from "@/components/people/ArchiveButton";
import { card, td, th } from "@/components/ui/styles";
import type { RecordRow } from "@/types";

export type PersonListRow = {
  id: string;
  full_name: string;
  mobile_number: string;
  records: RecordRow[] | null;
};

const link = "text-sm font-medium text-blue-600 hover:underline";
const tapLink = "inline-flex min-h-11 items-center text-sm font-medium text-blue-600 hover:underline";

export default function PeopleList({ people }: { people: PersonListRow[] }) {
  const rows = people.map((p) => ({ p, s: summarizeRecords(p.records ?? []) }));

  return (
    <>
      {/* Desktop table */}
      <div className={`${card} hidden overflow-x-auto p-0 xl:block`}>
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              {["Name", "Mobile", "Records", "Amount Given", "Amount Due", "Amount Paid", "Remaining", "Status", "Actions"].map((h) => (
                <th key={h} className={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(({ p, s }) => (
              <tr key={p.id}>
                <td className={`${td} font-medium text-slate-900`}>{p.full_name}</td>
                <td className={td}>{p.mobile_number}</td>
                <td className={td}>{s.count}</td>
                <td className={td}>{formatINR(s.given)}</td>
                <td className={td}>{formatINR(s.due)}</td>
                <td className={td}>{formatINR(s.paid)}</td>
                <td className={td}>{formatINR(s.remaining)}</td>
                <td className={td}><StatusBadge status={s.status} /></td>
                <td className={td}>
                  <div className="flex items-center gap-3">
                    <Link href={`/people/${p.id}`} className={link}>View</Link>
                    <Link href={`/people/${p.id}/edit`} className={link}>Edit</Link>
                    <ArchiveButton id={p.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:hidden">
        {rows.map(({ p, s }) => (
          <div key={p.id} className={card}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="break-words font-medium text-slate-900">{p.full_name}</p>
                <p className="text-sm text-slate-500">{p.mobile_number}</p>
              </div>
              <StatusBadge status={s.status} />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div><dt className="text-slate-500">Records</dt><dd>{s.count}</dd></div>
              <div><dt className="text-slate-500">Amount Given</dt><dd>{formatINR(s.given)}</dd></div>
              <div><dt className="text-slate-500">Amount Due</dt><dd>{formatINR(s.due)}</dd></div>
              <div><dt className="text-slate-500">Amount Paid</dt><dd>{formatINR(s.paid)}</dd></div>
              <div className="col-span-2"><dt className="text-slate-500">Remaining</dt><dd className="font-medium">{formatINR(s.remaining)}</dd></div>
            </dl>
            <div className="mt-3 flex items-center gap-5 border-t border-slate-100 pt-1">
              <Link href={`/people/${p.id}`} className={tapLink}>View</Link>
              <Link href={`/people/${p.id}/edit`} className={tapLink}>Edit</Link>
              <ArchiveButton id={p.id} className="inline-flex min-h-11 items-center text-sm font-medium text-red-600 hover:underline" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
