const inr = new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 2,
});

export function formatINR(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  return inr.format(Number.isFinite(n) ? n : 0).replace(/\.00$/, "");
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function maskAadhaar(value: string | null | undefined): string {
  const digits = (value ?? "").replace(/\D/g, "");
  if (digits.length < 4) return "—";
  return `XXXX XXXX ${digits.slice(-4)}`;
}

/** Indian-grouped number without the currency symbol, e.g. 150000 -> "1,50,000". */
export function formatAmount(value: number | string | null | undefined): string {
  return formatINR(value).replace("₹", "");
}

/** Shows only the last four digits of a bank account number, e.g. "XXXXXX1234". */
export function maskAccountNumber(value: string | null | undefined): string {
  const digits = (value ?? "").replace(/\D/g, "");
  return digits.length < 4 ? "—" : `XXXXXX${digits.slice(-4)}`;
}
