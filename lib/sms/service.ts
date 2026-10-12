// The only SMS entry point for the app. Server-side only: credentials never reach the browser.
import "server-only";
import { createProvider, getSmsStatus as readStatus, readSmsConfig, type SendSmsInput, type SendSmsResult } from "./provider.ts";
import { toInternationalIN } from "./phone.ts";

export type { SendSmsInput, SendSmsResult };

export function getSmsStatus() {
  return readStatus();
}

export function isSmsConfigured(): boolean {
  return readStatus().configured;
}

/** Sends one SMS. Returns not_configured (without contacting anyone) when no provider is set up. */
export async function sendSMS({ to, text }: SendSmsInput): Promise<SendSmsResult> {
  const config = readSmsConfig();
  if (!config) return { ok: false, reason: "not_configured" };
  if (!text.trim()) return { ok: false, reason: "failed", error: "Message is empty." };

  try {
    return await createProvider(config).send({ to: toInternationalIN(to), text });
  } catch {
    return { ok: false, reason: "failed", error: "Unexpected SMS error." };
  }
}
