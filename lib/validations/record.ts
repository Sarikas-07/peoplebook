export type RecordFields = {
  person_id: string;
  amount_given: string;
  date_given: string;
  amount_due: string;
  due_date: string;
  notes: string;
};
export type RecordFieldErrors = Partial<Record<keyof RecordFields, string>>;

const clean = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");

export function readRecordForm(fd: FormData): RecordFields {
  return {
    person_id: clean(fd.get("person_id")),
    amount_given: clean(fd.get("amount_given")).replace(/,/g, ""),
    date_given: clean(fd.get("date_given")),
    amount_due: clean(fd.get("amount_due")).replace(/,/g, ""),
    due_date: clean(fd.get("due_date")),
    notes: clean(fd.get("notes")),
  };
}

export function isValidDate(v: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

function checkAmount(v: string, label: string): string | undefined {
  const n = Number(v);
  if (!v) return `${label} is required.`;
  if (!Number.isFinite(n) || n <= 0) return `${label} must be greater than 0.`;
  if (!/^\d+(\.\d{1,2})?$/.test(v)) return `${label} can have at most 2 decimal places.`;
  return undefined;
}

export function validateRecord(v: RecordFields, requirePerson = true): RecordFieldErrors {
  const e: RecordFieldErrors = {};
  if (requirePerson && !v.person_id) e.person_id = "Please select a person.";
  const g = checkAmount(v.amount_given, "Amount given");
  if (g) e.amount_given = g;
  const d = checkAmount(v.amount_due, "Amount due");
  if (d) e.amount_due = d;
  if (!isValidDate(v.date_given)) e.date_given = "Enter a valid date.";
  if (!isValidDate(v.due_date)) e.due_date = "Enter a valid date.";
  if (v.notes.length > 2000) e.notes = "Notes must be 2000 characters or fewer.";
  return e;
}
