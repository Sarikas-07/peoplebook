"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { readRecordForm, validateRecord, type RecordFieldErrors } from "@/lib/validations/record";

export type RecordFormState = {
  error?: string;
  fieldErrors?: RecordFieldErrors;
  values?: Record<string, string>;
};

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ? supabase : null;
}

export async function createRecord(_prev: RecordFormState, fd: FormData): Promise<RecordFormState> {
  const v = readRecordForm(fd);
  const fieldErrors = validateRecord(v);
  if (Object.keys(fieldErrors).length) return { fieldErrors, values: v };

  const supabase = await requireUser();
  if (!supabase) return { error: "Your session has expired. Please sign in again.", values: v };

  const { data, error } = await supabase
    .from("records")
    .insert({
      person_id: v.person_id,
      amount_given: Number(v.amount_given),
      date_given: v.date_given,
      amount_due: Number(v.amount_due),
      due_date: v.due_date,
      notes: v.notes || null,
    })
    .select("id")
    .single();

  if (error || !data) return { error: "Unable to save record.", values: v };
  revalidatePath("/records");
  revalidatePath(`/people/${v.person_id}`);
  redirect(`/records/${data.id}?success=record_added`);
}

export async function updateRecord(id: string, _prev: RecordFormState, fd: FormData): Promise<RecordFormState> {
  const v = readRecordForm(fd);
  const fieldErrors = validateRecord(v, false);
  if (Object.keys(fieldErrors).length) return { fieldErrors, values: v };

  const supabase = await requireUser();
  if (!supabase) return { error: "Your session has expired. Please sign in again.", values: v };

  const { error } = await supabase
    .from("records")
    .update({
      amount_given: Number(v.amount_given),
      date_given: v.date_given,
      amount_due: Number(v.amount_due),
      due_date: v.due_date,
      notes: v.notes || null,
    })
    .eq("id", id);

  if (error) {
    const tooLow = error.message.includes("less than the amount already paid");
    return {
      error: tooLow ? "Amount due cannot be less than the amount already paid." : "Unable to save record.",
      values: v,
    };
  }
  revalidatePath("/records");
  revalidatePath(`/records/${id}`);
  redirect(`/records/${id}?success=record_updated`);
}
