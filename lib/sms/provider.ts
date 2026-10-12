// Provider-neutral SMS types and configuration. No provider-specific logic lives outside lib/sms/providers/.
import { createMsg91Provider } from "./providers/msg91.ts";

export type SendSmsInput = { to: string; text: string };

export type SendSmsResult =
  | { ok: true; providerMessageId?: string }
  | { ok: false; reason: "not_configured" | "failed"; error?: string };

export interface SmsProvider {
  readonly name: string;
  /** `to` is in international digits (e.g. 919876543210). Must never throw secrets in errors. */
  send(input: SendSmsInput): Promise<SendSmsResult>;
}

export type SmsConfig = {
  provider: SupportedProvider;
  apiKey: string;
  senderId: string;
  templateId: string;
  templateVariable: string;
};

export type Env = Record<string, string | undefined>;

// To add a provider: implement SmsProvider in providers/, then register it here.
const REQUIRED_ENV = {
  msg91: ["SMS_API_KEY", "SMS_SENDER_ID", "SMS_TEMPLATE_ID"],
} as const;
export type SupportedProvider = keyof typeof REQUIRED_ENV;

const isSupported = (v: string): v is SupportedProvider => v in REQUIRED_ENV;

/** Reports whether SMS is ready, and which variable NAMES are missing. Never returns secret values. */
export function getSmsStatus(env: Env = process.env): {
  configured: boolean; provider: string | null; missing: string[];
} {
  const name = env.SMS_PROVIDER?.trim().toLowerCase() ?? "";
  if (!name) return { configured: false, provider: null, missing: ["SMS_PROVIDER"] };
  if (!isSupported(name)) return { configured: false, provider: name, missing: [] };
  const missing = REQUIRED_ENV[name].filter((k) => !env[k]?.trim());
  return { configured: missing.length === 0, provider: name, missing };
}

/** Full config, or null unless the provider is supported and every required variable is set. */
export function readSmsConfig(env: Env = process.env): SmsConfig | null {
  if (!getSmsStatus(env).configured) return null;
  return {
    provider: env.SMS_PROVIDER!.trim().toLowerCase() as SupportedProvider,
    apiKey: env.SMS_API_KEY!.trim(),
    senderId: env.SMS_SENDER_ID!.trim(),
    templateId: env.SMS_TEMPLATE_ID!.trim(),
    templateVariable: env.SMS_TEMPLATE_VARIABLE?.trim() || "VAR1",
  };
}

export function createProvider(config: SmsConfig): SmsProvider {
  switch (config.provider) {
    case "msg91":
      return createMsg91Provider(config);
  }
}
