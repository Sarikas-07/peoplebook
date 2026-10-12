// MSG91 Flow API (https://control.msg91.com/api/v5/flow). The only file that knows about MSG91.
// India requires DLT-approved templates: the full message text is sent as ONE template variable
// (default VAR1), so the approved template must consist of that single variable.
import type { SendSmsInput, SendSmsResult, SmsConfig, SmsProvider } from "../provider.ts";

const ENDPOINT = "https://control.msg91.com/api/v5/flow";
const TIMEOUT_MS = 10_000;

type Fetch = typeof fetch;

export function createMsg91Provider(config: SmsConfig, fetchImpl: Fetch = fetch): SmsProvider {
  return {
    name: "msg91",
    async send({ to, text }: SendSmsInput): Promise<SendSmsResult> {
      try {
        const res = await fetchImpl(ENDPOINT, {
          method: "POST",
          headers: { authkey: config.apiKey, accept: "application/json", "content-type": "application/json" },
          body: JSON.stringify({
            template_id: config.templateId,
            sender: config.senderId,
            short_url: "0",
            recipients: [{ mobiles: to, [config.templateVariable]: text }],
          }),
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });

        const body = (await res.json().catch(() => null)) as { type?: string; message?: string } | null;
        // MSG91 can answer HTTP 200 with an error body, so both signals are checked.
        if (res.ok && body?.type === "success") {
          return { ok: true, providerMessageId: body.message ? String(body.message) : undefined };
        }
        return { ok: false, reason: "failed", error: body?.message ?? `HTTP ${res.status}` };
      } catch {
        return { ok: false, reason: "failed", error: "Request to SMS provider failed." };
      }
    },
  };
}
