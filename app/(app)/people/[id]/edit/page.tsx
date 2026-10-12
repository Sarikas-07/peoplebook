import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { maskAadhaar, maskAccountNumber } from "@/lib/format";
import PersonForm from "@/components/people/PersonForm";
import { updatePerson } from "../../actions";
import { card } from "@/components/ui/styles";

export default async function EditPersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("people")
    .select("full_name, address, mobile_number, alternative_mobile_number, aadhaar_number, notes, branch_name, branch_location, account_number")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();

  const { aadhaar_number, account_number, ...initial } = data;
  const masked = aadhaar_number ? maskAadhaar(aadhaar_number) : null;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-3xl text-slate-900">Edit Person</h1>
      <div className={card}>
        <PersonForm
          action={updatePerson.bind(null, id)}
          initial={initial}
          aadhaarMasked={masked}
          accountMasked={account_number ? maskAccountNumber(account_number) : null}
          cancelHref={`/people/${id}`}
          submitLabel="Save Changes"
        />
      </div>
    </div>
  );
}
