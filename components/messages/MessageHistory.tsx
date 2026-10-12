import { formatDate } from "@/lib/format";
import { MESSAGE_TYPE_LABEL, type MessageType } from "@/lib/sms/templates";
import { card, td, th } from "@/components/ui/styles";

export type MessageRow = {
  id: string; message_text: string; message_type: MessageType; recipient_mobile: string;
  status: "pending" | "sent" | "failed"; created_at: string; people: { full_name: string } | null;
};

const STATUS = {
  sent: { label: "Sent", cls: "bg-green-50 text-green-700" },
  failed: { label: "Failed", cls: "bg-red-50 text-red-700" },
  pending: { label: "Pending", cls: "bg-amber-50 text-amber-700" },
} as const;

function Badge({ status }: { status: MessageRow["status"] }) {
  const s = STATUS[status];
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${s.cls}`}>{s.label}</span>;
}

export default function MessageHistory({ rows }: { rows: MessageRow[] }) {
  return (
    <>
      <div className={`${card} hidden overflow-x-auto p-0 md:block`}>
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>{["Person", "Mobile Number", "Message Type", "Message", "Date", "Status"].map((h) => <th key={h} className={th}>{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((m) => (
              <tr key={m.id} className="align-top">
                <td className={`${td} font-medium text-slate-900`}>{m.people?.full_name ?? "—"}</td>
                <td className={td}>{m.recipient_mobile}</td>
                <td className={td}>{MESSAGE_TYPE_LABEL[m.message_type] ?? m.message_type}</td>
                <td className={`${td} max-w-sm whitespace-pre-line`}>{m.message_text}</td>
                <td className={td}>{formatDate(m.created_at)}</td>
                <td className={td}><Badge status={m.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 md:hidden">
        {rows.map((m) => (
          <div key={m.id} className={card}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-slate-900">{m.people?.full_name ?? "—"}</p>
                <p className="text-sm text-slate-500">{m.recipient_mobile}</p>
              </div>
              <Badge status={m.status} />
            </div>
            <p className="mt-2 text-xs text-slate-500">{MESSAGE_TYPE_LABEL[m.message_type] ?? m.message_type} · {formatDate(m.created_at)}</p>
            <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{m.message_text}</p>
          </div>
        ))}
      </div>
    </>
  );
}
