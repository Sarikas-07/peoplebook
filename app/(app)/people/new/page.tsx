import PersonForm from "@/components/people/PersonForm";
import { createPerson } from "../actions";
import { card } from "@/components/ui/styles";

export default function NewPersonPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-3xl text-slate-900">Add Person</h1>
      <div className={card}>
        <PersonForm action={createPerson} cancelHref="/people" submitLabel="Save Person" />
      </div>
    </div>
  );
}
