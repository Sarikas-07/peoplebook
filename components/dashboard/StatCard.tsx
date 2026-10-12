import type { LucideIcon } from "lucide-react";

const TONES = {
  default: { chip: "from-slate-600 to-slate-800 shadow-slate-900/25", value: "text-slate-900", bg: "from-white to-slate-100/80" },
  blue: { chip: "from-blue-500 to-blue-700 shadow-blue-900/30", value: "text-blue-800", bg: "from-white to-blue-100/70" },
  green: { chip: "from-emerald-500 to-emerald-700 shadow-emerald-900/30", value: "text-emerald-800", bg: "from-white to-emerald-100/70" },
  red: { chip: "from-rose-500 to-red-700 shadow-red-900/30", value: "text-red-700", bg: "from-white to-red-100/70" },
};

export default function StatCard({ label, value, tone = "default", icon: Icon }: {
  label: string; value: string | number; tone?: keyof typeof TONES; icon?: LucideIcon;
}) {
  const t = TONES[tone];
  return (
    <div className={`min-w-0 rounded-2xl bg-gradient-to-br ${t.bg} p-4 shadow-sm shadow-slate-900/[0.05] ring-1 ring-slate-900/[0.07] transition duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:p-5`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        {Icon && (
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md ${t.chip}`}>
            <Icon size={19} />
          </span>
        )}
      </div>
      <p className={`mt-3 break-words font-[family-name:var(--font-display)] text-2xl font-semibold tabular-nums sm:text-3xl ${t.value}`}>
        {value}
      </p>
    </div>
  );
}
