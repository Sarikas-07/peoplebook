"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { calculateRemaining, calculateTotalPaid, isPaymentWithinRemaining } from "@/lib/calculations";
import {
  OVER_PAYMENT_MESSAGE, readPaymentForm, validatePayment, type PaymentFieldErrors,
} from "@/lib/validations/payment";

export type PaymentFormState = {
  error?: string;
  fieldErrors?: PaymentFieldErrors;
  values?: Record<string, string>;
};

export async function createPayment(_prev: PaymentFormState, fd: FormData): Promise<PaymentFormState> {
  const v = readPaymentForm(fd);
  const fieldErrors = validatePayment(v);
  if (Object.keys(fieldErrors).length) return { fieldErrors, values: v };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Your session has expired. Please sign in again.", values: v };

  // Remaining amount is always recalculated from the real payments.
  const { data: record } = await supabase
    .from("records")
    .select("amount_due, payments(payment_amount)")
    .eq("id", v.record_id)
    .maybeSingle();
  if (!record) return { error: "Record not found.", values: v };

  const remaining = calculateRemaining(record.amount_due, calculateTotalPaid(record.payments));
  if (remaining <= 0) return { fieldErrors: { payment_amount: "This record is already fully paid." }, values: v };
  if (!isPaymentWithinRemaining(Number(v.payment_amount), remaining)) {
    return { fieldErrors: { payment_amount: OVER_PAYMENT_MESSAGE }, values: v };
  }

  const { data: created, error } = await supabase.from("payments").insert({
    record_id: v.record_id,
    payment_amount: Number(v.payment_amount),
    payment_date: v.payment_date,
    payment_method: v.payment_method,
    notes: v.notes || null,
  }).select("id").single();

  if (error || !created) {
    // The database trigger is the final guard against simultaneous over-payments.
    const over = error?.message.includes("greater than the remaining amount");
    return over
      ? { fieldErrors: { payment_amount: OVER_PAYMENT_MESSAGE }, values: v }
      : { error: "Unable to save payment.", values: v };
  }

  revalidatePath("/payments");
  revalidatePath("/records");
  revalidatePath(`/records/${v.record_id}`);
  redirect(`/records/${v.record_id}?success=payment_added&payment=${created.id}`);
}
