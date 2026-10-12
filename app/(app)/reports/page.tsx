import Link from "next/link";
import { Download } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatINR } from "@/lib/format";
import { loadReport, parseFilters } from "@/lib/reports";
import StatCard from "@/components/dashboard/StatCard";
import ReportFilters from "@/components/reports/ReportFilters";
import { ErrorAlert } from "@/components/ui/Alert";
import { btnSecondary, card, td, th } from "@/components/ui/styles";

export default async function ReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { filters, error: filterError } = parseFilters(sp);
  const supabase = await createClient();

  const [report, peopleList] = await Promise.all([
    loadReport(supabase, filters),
    supabase.from("people").select("id, full_name, is_archived").order("full_name"),
  ]);

  const qs = new URLSearchParams(
    Object.entries(filters).filter(([, v]) => v) as [string, string][],
  ).toString();
  const exportHref = (type: string) => `/reports/export?type=${type}${qs ? `&${qs}` : ""}`;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl text-slate-900">Reports</h1>

      <ReportFilters filters={filters} people={peopleList.data ?? []} />
      {filterError && <ErrorAlert>{filterError}</ErrorAlert>}

      {report.error ? (
        <ErrorAlert>Unable to load reports.</ErrorAlert>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="font-semibold text-slate-900">People Summary</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard label="Total People" value={report.peopleSummary.total} />
              <StatCard label="Active People" value={report.peopleSummary.active} tone="green" />
              <StatCard label="Archived People" value={report.peopleSummary.archived} />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-semibold text-slate-900">Financial Summary</h2>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard label="Total Amount Given" value={formatINR(report.portfolio.given)} />
              <StatCard label="Total Amount Due" value={formatINR(report.portfolio.due)} />
              <StatCard label="Total Amount Received" value={formatINR(report.portfolio.received)} tone="green" />
              <StatCard label="Total Remaining" value={formatINR(report.portfolio.remaining)} tone="blue" />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-semibold text-slate-900">Status Report</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard label="Active" value={report.portfolio.activeRecords} tone="blue" />
              <StatCard label="Overdue" value={report.portfolio.overdueRecords} tone="red" />
              <StatCard label="Paid" value={report.portfolio.paidRecords} tone="green" />
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-semibold text-slate-900">Payment Report</h2>
              <div className="flex gap-2">
                <Link href={exportHref("payments")} prefetch={false} className={btnSecondary}>
                  <Download size={16} /> Export CSV
                </Link>
                <Link href={exportHref("records")} prefetch={false} className={btnSecondary}>
                  <Download size={16} /> Export Records CSV
                </Link>
              </div>
            </div>

            {report.paymentRows.length === 0 ? (
              <div className={`${card} py-10 text-center text-slate-500`}>No payments found.</div>
            ) : (
              <>
                <div className={`${card} hidden overflow-x-auto p-0 md:block`}>
                  <table className="w-full">
                    <thead className="border-b border-slate-200 bg-slate-50">
                      <tr>{["Person", "Amount", "Payment Date", "Payment Method"].map((h) => <th key={h} className={th}>{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {report.paymentRows.map((p) => (
                        <tr key={p.id}>
                          <td className={`${td} font-medium text-slate-900`}>
                            <Link href={`/records/${p.recordId}`} className="hover:underline">{p.person}</Link>
                          </td>
                          <td className={td}>{formatINR(p.amount)}</td>
                          <td className={td}>{formatDate(p.date)}</td>
                          <td className={td}>{p.method}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 md:hidden">
                  {report.paymentRows.map((p) => (
                    <Link key={p.id} href={`/records/${p.recordId}`} className={`${card} block`}>
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-medium text-slate-900">{p.person}</p>
                        <p className="font-semibold text-slate-900">{formatINR(p.amount)}</p>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">{formatDate(p.date)} · {p.method}</p>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}
