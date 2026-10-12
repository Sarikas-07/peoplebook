import { createClient } from "@/lib/supabase/server";
import { loadReport, parseFilters } from "@/lib/reports";
import { toCsv } from "@/lib/csv";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const url = new URL(request.url);
  const sp = Object.fromEntries(url.searchParams.entries());
  const report = await loadReport(supabase, parseFilters(sp).filters);
  if (report.error) return new Response("Unable to generate report.", { status: 500 });

  const isRecords = sp.type === "records";
  const csv = isRecords
    ? toCsv(
        ["Person", "Amount Given", "Amount Due", "Amount Paid", "Remaining", "Date Given", "Due Date", "Status"],
        report.recordRows.map((r) => [r.person, r.amountGiven, r.amountDue, r.amountPaid, r.remaining, r.dateGiven, r.dueDate, r.status]),
      )
    : toCsv(
        ["Person", "Amount", "Payment Date", "Payment Method"],
        report.paymentRows.map((p) => [p.person, p.amount, p.date, p.method]),
      );

  return new Response("\uFEFF" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${isRecords ? "records" : "payments"}-report.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
