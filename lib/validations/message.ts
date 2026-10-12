import { MESSAGE_TYPES } from "@/lib/sms/templates";

export const MAX_MESSAGE_LENGTH = 1000;

export type MessageFields = { person_id: string; record_id: string; message_type: string; message_text: string };
export type MessageFieldErrors = Partial<Record<keyof MessageFields, string>>;

const clean = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");

export function readMessageForm(fd: FormData): MessageFields {
  return {
    person_id: clean(fd.get("person_id")),
    record_id: clean(fd.get("record_id")),
    message_type: clean(fd.get("message_type")),
    message_text: clean(fd.get("message_text")),
  };
}

export function validateMessage(v: MessageFields): MessageFieldErrors {
  const e: MessageFieldErrors = {};
  if (!v.person_id) e.person_id = "Please select a person.";
  if (!MESSAGE_TYPES.some((t) => t.value === v.message_type)) e.message_type = "Select a message type.";
  if (!v.message_text) e.message_text = "Message cannot be empty.";
  else if (v.message_text.length > MAX_MESSAGE_LENGTH) e.message_text = `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.`;
  return e;
}
