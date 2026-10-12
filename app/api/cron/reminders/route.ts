import { timingSafeEqual } from "node:crypto";
import { runReminders } from "@/lib/reminders/run";

export const dynamic = "force-dynamic";

function authorized(request: Request, secret: string): boolean {
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

// Called by the Vercel Cron schedule in vercel.json. Vercel sends "Authorization: Bearer <CRON_SECRET>".
// The response contains counts only: no names, numbers or message text.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return Response.json({ error: "Scheduled reminders are not configured." }, { status: 503 });
  if (!authorized(request, secret)) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const result = await runReminders();
  return Response.json(result, { status: result.status === "error" ? 500 : 200 });
}
