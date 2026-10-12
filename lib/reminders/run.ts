// Scheduled reminder run:
// find eligible records -> check message history -> skip duplicates -> build message -> send -> store result.
import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSmsConfigured, sendSMS } from "@/lib/sms/service";
import { todayIST } from "@/lib/calculations";
import { getReminderStatus } from "./config";
import { addDays, selectDueReminders, type PriorMessage, type ReminderRecord } from "./engine";

export type ReminderRunResult =
  | { status: "skipped"; reason: string }
  | { status: "error" }
  | { status: "dry_run"; planned: number }
  | { status: "completed"; planned: number; sent: number; failed: number };

export async function runReminders(now = new Date()): Promise<ReminderRunResult> {
  const { enabled, config } = getReminderStatus();

  if (!isSmsConfigured()) return { status: "skipped", reason: "SMS service is not configured." };
  const admin = createAdminClient();
  if (!admin) return { status: "skipped", reason: "Server credentials are not configured." };

  const today = todayIST();
  const historyDays = Math.max(config.upcomingDaysBefore + 1, config.overdueRepeatEveryDays);

  const [records, messages] = await Promise.all([
    admin
      .from("records")
      .select("id, amount_due, due_date, payments(payment_amount), people!inner(id, full_name, mobile_number, is_archived)")
      .lte("due_date", addDays(today, config.upcomingDaysBefore))
      .eq("people.is_archived", false),
    admin
      .from("messages")
      .select("record_id, message_type, status, created_at")
      .in("message_type", ["upcoming_reminder", "overdue_reminder"])
      .gte("created_at", new Date(now.getTime() - historyDays * 86_400_000).toISOString()),
  ]);
  if (records.error || messages.error) return { status: "error" };

  const planned = selectDueReminders({
    records: (records.data ?? []) as unknown as ReminderRecord[],
    messages: (messages.data ?? []) as PriorMessage[],
    today, now, config,
  }).slice(0, config.maxPerRun);

  // Safety default: without AUTO_REMINDERS_ENABLED=true nothing is sent, the run only reports what it would do.
  if (!enabled) return { status: "dry_run", planned: planned.length };

  let sent = 0, failed = 0;
  for (const p of planned) {
    // The history row is written BEFORE sending so an overlapping run sees it and skips this record.
    const { data: row, error } = await admin
      .from("messages")
      .insert({
        person_id: p.personId, record_id: p.recordId, message_text: p.text,
        message_type: p.type, recipient_mobile: p.mobile, status: "pending",
      })
      .select("id")
      .single();
    if (error || !row) { failed++; continue; }

    const result = await sendSMS({ to: p.mobile, text: p.text });
    await admin
      .from("messages")
      .update(result.ok
        ? { status: "sent", sent_at: new Date().toISOString(), provider_message_id: result.providerMessageId ?? null }
        : { status: "failed" })
      .eq("id", row.id);
    if (result.ok) sent++;
    else failed++;
  }
  return { status: "completed", planned: planned.length, sent, failed };
}
