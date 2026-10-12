/** Converts a stored Indian mobile number to international digits, e.g. "98765 43210" -> "919876543210". */
export function toInternationalIN(raw: string): string {
  const d = raw.replace(/\D/g, "");
  if (d.length === 10) return `91${d}`;
  if (d.length === 11 && d.startsWith("0")) return `91${d.slice(1)}`;
  return d;
}
