import { test } from "node:test";
import assert from "node:assert/strict";
import { getSmsStatus, readSmsConfig, type SmsConfig } from "./provider.ts";
import { createMsg91Provider } from "./providers/msg91.ts";
import { toInternationalIN } from "./phone.ts";

const FULL = { SMS_PROVIDER: "MSG91", SMS_API_KEY: "key", SMS_SENDER_ID: "PPLBK", SMS_TEMPLATE_ID: "tpl" };
const CONFIG = readSmsConfig(FULL) as SmsConfig;

test("phone numbers become international digits", () => {
  assert.equal(toInternationalIN("98765 43210"), "919876543210");
  assert.equal(toInternationalIN("+91 98765-43210"), "919876543210");
  assert.equal(toInternationalIN("09876543210"), "919876543210");
});

test("status: nothing set, unknown provider, partly set, fully set", () => {
  assert.deepEqual(getSmsStatus({}), { configured: false, provider: null, missing: ["SMS_PROVIDER"] });
  assert.equal(getSmsStatus({ SMS_PROVIDER: "foo" }).configured, false);
  assert.deepEqual(getSmsStatus({ SMS_PROVIDER: "msg91", SMS_API_KEY: "k" }).missing, ["SMS_SENDER_ID", "SMS_TEMPLATE_ID"]);
  assert.equal(getSmsStatus(FULL).configured, true);
  assert.equal(readSmsConfig({ SMS_PROVIDER: "msg91" }), null);
});

test("msg91 sends the expected request and returns the provider id", async () => {
  let seen: { url: string; init: RequestInit } | undefined;
  const fake = (async (url: string, init: RequestInit) => {
    seen = { url, init };
    return new Response(JSON.stringify({ type: "success", message: "req-123" }), { status: 200 });
  }) as unknown as typeof fetch;

  const result = await createMsg91Provider(CONFIG, fake).send({ to: "919876543210", text: "Hello" });
  assert.deepEqual(result, { ok: true, providerMessageId: "req-123" });
  assert.equal(seen?.url, "https://control.msg91.com/api/v5/flow");
  assert.equal((seen?.init.headers as Record<string, string>).authkey, "key");
  assert.deepEqual(JSON.parse(seen?.init.body as string), {
    template_id: "tpl", sender: "PPLBK", short_url: "0",
    recipients: [{ mobiles: "919876543210", VAR1: "Hello" }],
  });
});

test("msg91 treats an HTTP 200 error body, a bad status, and network errors as failures", async () => {
  const respond = (status: number, body: unknown) =>
    (async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;
  const send = (f: typeof fetch) => createMsg91Provider(CONFIG, f).send({ to: "919876543210", text: "x" });

  assert.equal((await send(respond(200, { type: "error", message: "bad key" }))).ok, false);
  assert.equal((await send(respond(500, {}))).ok, false);
  const down = (async () => { throw new Error("offline"); }) as unknown as typeof fetch;
  const r = await send(down);
  assert.equal(r.ok, false);
  assert.ok(!JSON.stringify(r).includes("key"), "errors must not leak credentials");
});
