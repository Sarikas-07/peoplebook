"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { readPersonForm, validatePerson, type FieldErrors } from "@/lib/validations/person";

export type PersonFormState = {
  error?: string;
  fieldErrors?: FieldErrors;
  values?: Record<string, string>;
};

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ? supabase : null;
}

export async function createPerson(_prev: PersonFormState, fd: FormData): Promise<PersonFormState> {
  const v = readPersonForm(fd);
  const values = { ...v, aadhaar_number: "" }; // never echo Aadhaar back
  const fieldErrors = validatePerson(v);
  if (Object.keys(fieldErrors).length) return { fieldErrors, values };

  const supabase = await requireUser();
  if (!supabase) return { error: "Your session has expired. Please sign in again.", values };

  const { data, error } = await supabase
    .from("people")
    .insert({
      full_name: v.full_name,
      address: v.address || null,
      mobile_number: v.mobile_number,
      alternative_mobile_number: v.alternative_mobile_number || null,
      aadhaar_number: v.aadhaar_number || null,
      notes: v.notes || null,
      branch_name: v.branch_name || null,
      branch_location: v.branch_location || null,
      account_number: v.account_number || null,
    })
    .select("id")
    .single();

  if (error || !data) return { error: "Unable to save person.", values };
  revalidatePath("/people");
  redirect(`/people/${data.id}?success=added`);
}

export async function updatePerson(id: string, _prev: PersonFormState, fd: FormData): Promise<PersonFormState> {
  const v = readPersonForm(fd);
  const values = { ...v, aadhaar_number: "" };
  const fieldErrors = validatePerson(v);
  if (Object.keys(fieldErrors).length) return { fieldErrors, values };

  const supabase = await requireUser();
  if (!supabase) return { error: "Your session has expired. Please sign in again.", values };

  const update: Record<string, string | null> = {
    full_name: v.full_name,
    address: v.address || null,
    mobile_number: v.mobile_number,
    alternative_mobile_number: v.alternative_mobile_number || null,
    notes: v.notes || null,
    branch_name: v.branch_name || null,
    branch_location: v.branch_location || null,
  };
  // Account number: same rule as Aadhaar below.
  if (fd.get("remove_account_number") === "on") update.account_number = null;
  else if (v.account_number) update.account_number = v.account_number;
  // Aadhaar: blank = keep existing, new value = replace, checkbox = remove.
  if (fd.get("remove_aadhaar") === "on") update.aadhaar_number = null;
  else if (v.aadhaar_number) update.aadhaar_number = v.aadhaar_number;

  const { error } = await supabase.from("people").update(update).eq("id", id);
  if (error) return { error: "Unable to save person.", values };
  revalidatePath("/people");
  revalidatePath(`/people/${id}`);
  redirect(`/people/${id}?success=updated`);
}

export async function archivePerson(id: string) {
  const supabase = await requireUser();
  if (!supabase) redirect("/login");
  const { error } = await supabase.from("people").update({ is_archived: true }).eq("id", id);
  if (error) redirect("/people?error=archive");
  revalidatePath("/people");
  redirect("/people?success=archived");
}

/** Returns the full account number only when the admin asks to see it. Nothing is logged. */
export async function revealAccountNumber(personId: string): Promise<{ value?: string; error?: string }> {
  if (!/^[0-9a-f-]{36}$/i.test(personId)) return { error: "Unable to show the account number." };
  const supabase = await requireUser();
  if (!supabase) return { error: "Your session has expired. Please sign in again." };
  const { data, error } = await supabase.from("people").select("account_number").eq("id", personId).maybeSingle();
  if (error || !data?.account_number) return { error: "Unable to show the account number." };
  return { value: data.account_number as string };
}
