import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { getSmsStatus } from "@/lib/sms/service";
import { getReminderStatus } from "@/lib/reminders/config";
import { DEFAULT_TEMPLATES, MESSAGE_TYPES } from "@/lib/sms/templates";
import { card } from "@/components/ui/styles";

const PLACEHOLDERS = ["{person_name}", "{payment_amount}", "{total_paid}", "{remaining_amount}", "{due_date}"];

export default function SettingsPage() {
  const sms = getSmsStatus();
  const reminders = getReminderStatus();
  const unsupported = Boolean(sms.provider) && !sms.configured && sms.missing.length === 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl text-slate-900">Settings</h1>

      <section className={card}>
        <h2 className="mb-3 font-semibold text-slate-900">Application Name</h2>
        <p className="text-lg font-medium text-slate-900">{APP_NAME}</p>
        <p className="text-sm text-slate-500">{APP_TAGLINE}</p>
        <p className="mt-3 text-xs text-slate-500">The name is set in one place: <code>lib/constants.ts</code>.</p>
      </section>

      <section className={card}>
        <h2 className="mb-3 font-semibold text-slate-900">SMS Configuration</h2>
        {sms.configured ? (
          <p className="rounded-lg bg-green-50 px-3 py-2.5 text-sm text-green-700">
            SMS service is configured ({sms.provider}).
          </p>
        ) : (
          <div className="space-y-2">
            <p className="rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-800">SMS service is not configured.</p>
            {unsupported && <p className="text-sm text-slate-600">The provider “{sms.provider}” is not supported.</p>}
            {sms.missing.length > 0 && (
              <p className="text-sm text-slate-600">Missing settings: {sms.missing.join(", ")}</p>
            )}
          </div>
        )}
        <p className="mt-3 text-xs text-slate-500">
          SMS credentials are server-side environment variables and are never shown or sent to the browser.
        </p>
      </section>

      <section className={card}>
        <h2 className="mb-3 font-semibold text-slate-900">Automatic Reminders</h2>
        <p className={`rounded-lg px-3 py-2.5 text-sm ${reminders.enabled ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-700"}`}>
          {reminders.enabled ? "Automatic reminders are on." : "Automatic reminders are off. Scheduled runs only preview."}
        </p>
        <ul className="mt-3 space-y-1 text-sm text-slate-600">
          <li>Upcoming reminder: {reminders.config.upcomingDaysBefore} days before the due date, once per record.</li>
          <li>Overdue reminder: repeated at most every {reminders.config.overdueRepeatEveryDays} days.</li>
          <li>Maximum {reminders.config.maxPerRun} messages per run.</li>
          <li>Payment confirmations are always reviewed and sent by you.</li>
        </ul>
        {!reminders.scheduleReady && (
          <p className="mt-3 text-xs text-slate-500">The scheduled job is not set up yet (see the README).</p>
        )}
      </section>

      <section className={card}>
        <h2 className="mb-1 font-semibold text-slate-900">Default Message Templates</h2>
        <p className="mb-4 text-xs text-slate-500">
          These pre-fill the Messages page, where you can edit every message before sending.
          Available placeholders: {PLACEHOLDERS.join(" ")}
        </p>
        <div className="space-y-4">
          {MESSAGE_TYPES.filter((t) => t.value !== "custom").map((t) => (
            <div key={t.value}>
              <p className="mb-1 text-sm font-medium text-slate-700">{t.label}</p>
              <pre className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 font-sans text-sm text-slate-700">
                {DEFAULT_TEMPLATES[t.value]}
              </pre>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
