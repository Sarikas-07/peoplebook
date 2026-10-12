import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RecordForm from "@/components/records/RecordForm";
import { updateRecord } from "../../actions";
import { card } from "@/components/ui/styles";

export default async function EditRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("records")
    .select("amount_given, date_given, amount_due, due_date, notes, people(full_name)")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();

  const person = data.people as unknown as { full_name: string } | null;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-3xl text-slate-900">Edit Record</h1>
      <div className={card}>
        <RecordForm
          action={updateRecord.bind(null, id)}
          lockedPersonName={person?.full_name ?? "—"}
          initial={data}
          cancelHref={`/records/${id}`}
          submitLabel="Save Changes"
        />
      </div>
    </div>
  );
}
