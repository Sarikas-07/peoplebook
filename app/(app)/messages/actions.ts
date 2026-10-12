"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSmsConfigured, sendSMS } from "@/lib/sms/service";
import { readMessageForm, validateMessage, type MessageFieldErrors } from "@/lib/validations/message";

export type MessageFormState = { error?: string; success?: string; fieldErrors?: MessageFieldErrors };

export async function sendMessage(_prev: MessageFormState, fd: FormData): Promise<MessageFormState> {
  const v = readMessageForm(fd);
  const fieldErrors = validateMessage(v);
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  // Nothing is sent or logged when SMS is not set up: no fake "sent" records.
  if (!isSmsConfigured()) return { error: "SMS service is not configured. Your message was not sent." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Your session has expired. Please sign in again." };

  // The mobile number always comes from the database, never from the browser.
  const { data: person } = await supabase.from("people").select("id, full_name, mobile_number").eq("id", v.person_id).maybeSingle();
  if (!person) return { error: "Person not found." };

  if (v.record_id) {
    const { data: record } = await supabase.from("records").select("id").eq("id", v.record_id).eq("person_id", person.id).maybeSingle();
    if (!record) return { error: "Record not found." };
  }

  const { data: row, error: insertError } = await supabase
    .from("messages")
    .insert({
      person_id: person.id,
      record_id: v.record_id || null,
      message_text: v.message_text,
      message_type: v.message_type,
      recipient_mobile: person.mobile_number,
      status: "pending",
    })
    .select("id")
    .single();
  if (insertError || !row) return { error: "Unable to send message. Nothing was sent." }; // never send without a history record

  const result = await sendSMS({ to: person.mobile_number, text: v.message_text });

  await supabase
    .from("messages")
    .update(result.ok
      ? { status: "sent", sent_at: new Date().toISOString(), provider_message_id: result.providerMessageId ?? null }
      : { status: "failed" })
    .eq("id", row.id);

  revalidatePath("/messages");
  if (!result.ok) return { error: "Unable to send message. It is saved in Message History as Failed." };
  const last4 = person.mobile_number.replace(/\D/g, "").slice(-4);
  return { success: `Message sent successfully to ${person.full_name} (XXXXXX${last4}).` };
}
