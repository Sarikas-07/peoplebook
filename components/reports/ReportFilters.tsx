import Link from "next/link";
import { btnPrimary, btnSecondary, card, input } from "@/components/ui/styles";
import type { ReportFilters as Filters } from "@/lib/reports";

type Person = { id: string; full_name: string; is_archived: boolean };

export default function ReportFilters({ filters, people }: { filters: Filters; people: Person[] }) {
  const label = "block text-sm font-medium text-slate-700";
  return (
    <form className={`${card} space-y-4`}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className={label}>From Date
          <input type="date" name="from" defaultValue={filters.from ?? ""} className={input} />
        </label>
        <label className={label}>To Date
          <input type="date" name="to" defaultValue={filters.to ?? ""} className={input} />
        </label>
        <label className={label}>Person
          <select name="person" defaultValue={filters.person ?? ""} className={input}>
            <option value="">All people</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>{p.full_name}{p.is_archived ? " (archived)" : ""}</option>
            ))}
          </select>
        </label>
        <label className={label}>Status
          <select name="status" defaultValue={filters.status ?? ""} className={input}>
            <option value="">All</option>
            <option value="Active">Active</option>
            <option value="Overdue">Overdue</option>
            <option value="Paid">Paid</option>
          </select>
        </label>
      </div>
      <p className="text-xs text-slate-500">Dates filter records by Date Given and payments by Payment Date.</p>
      <div className="flex gap-3">
        <button type="submit" className={btnPrimary}>Apply Filters</button>
        <Link href="/reports" className={btnSecondary}>Reset Filters</Link>
      </div>
    </form>
  );
}
