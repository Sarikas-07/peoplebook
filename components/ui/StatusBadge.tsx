import type { RecordStatus } from "@/types";

const STYLES: Record<RecordStatus, { wrap: string; dot: string }> = {
  Active: { wrap: "bg-blue-50 text-blue-800 ring-blue-700/15", dot: "bg-blue-500" },
  Overdue: { wrap: "bg-red-50 text-red-800 ring-red-700/15", dot: "bg-red-500" },
  Paid: { wrap: "bg-emerald-50 text-emerald-800 ring-emerald-700/15", dot: "bg-emerald-500" },
};

export default function StatusBadge({ status }: { status: RecordStatus | null }) {
  if (!status) return <span className="text-slate-400">—</span>;
  const s = STYLES[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${s.wrap}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} /> {status}
    </span>
  );
}
