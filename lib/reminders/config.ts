import type { Env } from "../sms/provider.ts";

/** Reminder timing. Defaults can be overridden with environment variables; a settings screen can replace this later. */
export type ReminderConfig = {
  upcomingDaysBefore: number;     // remind when the due date is this many days away (or fewer)
  overdueRepeatEveryDays: number; // repeat overdue reminders no more often than this
  maxPerRun: number;              // hard cap on messages in a single scheduled run
};

export const DEFAULT_REMINDER_CONFIG: ReminderConfig = { upcomingDaysBefore: 3, overdueRepeatEveryDays: 7, maxPerRun: 50 };

function int(value: string | undefined, fallback: number, min: number, max: number): number {
  const n = Number(value);
  return Number.isInteger(n) && n >= min && n <= max ? n : fallback;
}

export function readReminderConfig(env: Env = process.env): ReminderConfig {
  const d = DEFAULT_REMINDER_CONFIG;
  return {
    upcomingDaysBefore: int(env.REMINDER_UPCOMING_DAYS, d.upcomingDaysBefore, 0, 30),
    overdueRepeatEveryDays: int(env.REMINDER_OVERDUE_REPEAT_DAYS, d.overdueRepeatEveryDays, 1, 90),
    maxPerRun: int(env.REMINDER_MAX_PER_RUN, d.maxPerRun, 1, 500),
  };
}

/** Automatic sending is OFF unless AUTO_REMINDERS_ENABLED is exactly "true". When off, runs only preview. */
export function getReminderStatus(env: Env = process.env) {
  return {
    enabled: env.AUTO_REMINDERS_ENABLED === "true",
    scheduleReady: Boolean(env.CRON_SECRET && env.SUPABASE_SERVICE_ROLE_KEY),
    config: readReminderConfig(env),
  };
}
