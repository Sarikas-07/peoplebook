import { AlertCircle, CheckCircle2 } from "lucide-react";

export function ErrorAlert({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
      <AlertCircle size={16} className="shrink-0" /> {children}
    </p>
  );
}

const FLASH: Record<string, string> = {
  added: "Person added successfully.",
  updated: "Person updated successfully.",
  archived: "Person archived successfully.",
  record_added: "Record added successfully.",
  record_updated: "Record updated successfully.",
  payment_added: "Payment recorded successfully.",
};

/** Success banner driven by ?success=key in the URL. */
export function Flash({ code }: { code?: string }) {
  const text = code ? FLASH[code] : undefined;
  if (!text) return null;
  return (
    <p role="status" className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2.5 text-sm text-green-700">
      <CheckCircle2 size={16} className="shrink-0" /> {text}
    </p>
  );
}
