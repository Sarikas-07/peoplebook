import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { cleanSearchTerm } from "@/lib/search";
import PeopleList, { type PersonListRow } from "@/components/people/PeopleList";
import { ErrorAlert, Flash } from "@/components/ui/Alert";
import { btnPrimary, btnSecondary, card, input } from "@/components/ui/styles";

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; success?: string; error?: string }>;
}) {
  const { q = "", success, error: errorCode } = await searchParams;
  const term = cleanSearchTerm(q);

  const supabase = await createClient();
  let query = supabase
    .from("people")
    .select("id, full_name, mobile_number, records(id, person_id, amount_given, date_given, amount_due, due_date, notes, payments(payment_amount))")
    .eq("is_archived", false)
    .order("full_name");
  if (term) query = query.or(`full_name.ilike.%${term}%,mobile_number.ilike.%${term}%`);

  const { data, error } = await query;
  const people = (data ?? []) as unknown as PersonListRow[];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl text-slate-900">People</h1>
        <Link href="/people/new" className={btnPrimary}><Plus size={16} /> Add Person</Link>
      </div>

      <Flash code={success} />
      {errorCode === "archive" && <ErrorAlert>Unable to archive person.</ErrorAlert>}

      <form className="flex gap-2" role="search">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input name="q" defaultValue={q} placeholder="Search by name or mobile number"
            className={`${input} mt-0 pl-9`} />
        </div>
        <button type="submit" className={btnPrimary}>Search</button>
        {q && <Link href="/people" className={btnSecondary}>Clear</Link>}
      </form>

      {error ? (
        <ErrorAlert>Unable to load people.</ErrorAlert>
      ) : people.length === 0 ? (
        <div className={`${card} py-12 text-center text-slate-500`}>No people found.</div>
      ) : (
        <PeopleList people={people} />
      )}
    </div>
  );
}
