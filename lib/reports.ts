import type { SupabaseClient } from "@supabase/supabase-js";
import { isValidDate } from "@/lib/validations/record";
import { summarizePortfolio, summarizeRecord } from "@/lib/calculations";
import type { RecordRow, RecordStatus } from "@/types";

export type ReportFilters = { from?: string; to?: string; person?: string; status?: RecordStatus };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STATUSES: RecordStatus[] = ["Active", "Overdue", "Paid"];

export function parseFilters(sp: Record<string, string | undefined>): { filters: ReportFilters; error?: string } {
  const filters: ReportFilters = {};
  let error: string | undefined;
  if (sp.from && isValidDate(sp.from)) filters.from = sp.from;
  if (sp.to && isValidDate(sp.to)) filters.to = sp.to;
  if (filters.from && filters.to && filters.from > filters.to) {
    error = "From date cannot be after To date.";
    delete filters.from;
    delete filters.to;
  }
  if (sp.person && UUID.test(sp.person)) filters.person = sp.person;
  const status = STATUSES.find((s) => s === sp.status);
  if (status) filters.status = status;
  return { filters, error };
}

type RawPayment = { id: string; payment_amount: number; payment_date: string; payment_method: string };
type RawRecord = Omit<RecordRow, "payments"> & { people: { full_name: string } | null; payments: RawPayment[] | null };

export type ReportRecord = {
  id: string; person: string; amountGiven: number; amountDue: number; amountPaid: number;
  remaining: number; dateGiven: string; dueDate: string; status: RecordStatus;
};
export type ReportPayment = { id: string; recordId: string; person: string; amount: number; date: string; method: string };

const inRange = (d: string, from?: string, to?: string) => (!from || d >= from) && (!to || d <= to);

/**
 * Date filters: records are filtered by Date Given, payments by Payment Date.
 * Person and Status filters apply to both (a payment's status is its record's status).
 */
export async function loadReport(supabase: SupabaseClient, f: ReportFilters) {
  let recordsQuery = supabase
    .from("records")
    .select("id, person_id, amount_given, date_given, amount_due, due_date, notes, people(full_name), payments(id, payment_amount, payment_date, payment_method)");
  let peopleQuery = supabase.from("people").select("id, is_archived");
  if (f.person) {
    recordsQuery = recordsQuery.eq("person_id", f.person);
    peopleQuery = peopleQuery.eq("id", f.person);
  }
  const [records, people] = await Promise.all([recordsQuery, peopleQuery]);
  if (records.error || people.error) return { error: true as const };

  const withStatus = ((records.data ?? []) as unknown as RawRecord[])
    .map((r) => ({ r, s: summarizeRecord(r) }))
    .filter(({ s }) => !f.status || s.status === f.status);

  const inScope = withStatus.filter(({ r }) => inRange(r.date_given, f.from, f.to));
  const recordRows: ReportRecord[] = inScope
    .map(({ r, s }) => ({
      id: r.id, person: r.people?.full_name ?? "—",
      amountGiven: Number(r.amount_given), amountDue: Number(r.amount_due),
      amountPaid: s.totalPaid, remaining: s.remaining,
      dateGiven: r.date_given, dueDate: r.due_date, status: s.status,
    }))
    .sort((a, b) => b.dateGiven.localeCompare(a.dateGiven));

  const paymentRows: ReportPayment[] = withStatus
    .flatMap(({ r }) => (r.payments ?? []).map((p) => ({
      id: p.id, recordId: r.id, person: r.people?.full_name ?? "—",
      amount: Number(p.payment_amount), date: p.payment_date, method: p.payment_method,
    })))
    .filter((p) => inRange(p.date, f.from, f.to))
    .sort((a, b) => b.date.localeCompare(a.date));

  const peopleRows = people.data ?? [];
  return {
    error: false as const,
    peopleSummary: {
      total: peopleRows.length,
      active: peopleRows.filter((p) => !p.is_archived).length,
      archived: peopleRows.filter((p) => p.is_archived).length,
    },
    portfolio: summarizePortfolio(inScope.map(({ r }) => r)),
    recordRows,
    paymentRows,
  };
}
