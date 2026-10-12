/** Builds a CSV string. Text cells that could be run as spreadsheet formulas are neutralised. */
export function toCsv(headers: string[], rows: (string | number)[][]): string {
  const cell = (v: string | number) => {
    if (typeof v === "number") return String(v);
    const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
    return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  return [headers, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
}
