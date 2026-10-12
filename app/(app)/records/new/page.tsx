import { createClient } from "@/lib/supabase/server";
import RecordForm from "@/components/records/RecordForm";
import { ErrorAlert } from "@/components/ui/Alert";
import { createRecord } from "../actions";
import { card } from "@/components/ui/styles";

export default async function NewRecordPage({ searchParams }: { searchParams: Promise<{ person?: string }> }) {
  const { person } = await searchParams;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("people").select("id, full_name, mobile_number").eq("is_archived", false).order("full_name");

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-3xl text-slate-900">Add Record</h1>
      <div className={card}>
        {error ? (
          <ErrorAlert>Unable to load people.</ErrorAlert>
        ) : (
          <RecordForm
            action={createRecord}
            people={data ?? []}
            initial={{ person_id: person }}
            cancelHref={person ? `/people/${person}` : "/records"}
            submitLabel="Save Record"
          />
        )}
      </div>
    </div>
  );
}
