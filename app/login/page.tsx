 
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  AlertCircle,
  BarChart3,
  Eye,
  EyeOff,
  FileText,
  IndianRupee,
  Loader2,
  Lock,
  Mail,
  MessageSquare,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { ADMIN_ROLE, APP_TAGLINE } from "@/lib/constants";
import { btnPrimary, input } from "@/components/ui/styles";

const TILES: {
  icon: LucideIcon;
  style: React.CSSProperties;
  size: number;
  delay: string;
}[] = [
  { icon: Users, style: { left: "7%", top: "16%" }, size: 72, delay: "0s" },
  { icon: IndianRupee, style: { left: "17%", top: "68%" }, size: 64, delay: "-2s" },
  { icon: FileText, style: { left: "30%", top: "7%" }, size: 52, delay: "-5s" },
  { icon: MessageSquare, style: { right: "8%", top: "14%" }, size: 68, delay: "-4s" },
  { icon: BarChart3, style: { right: "15%", top: "70%" }, size: 72, delay: "-1s" },
  { icon: ShieldCheck, style: { right: "30%", top: "6%" }, size: 52, delay: "-3s" },
];

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError) {
        console.error("Supabase login error:", loginError.message);
        setError(loginError.message);
        return;
      }

      if (data.user?.app_metadata?.role !== ADMIN_ROLE) {
        await supabase.auth.signOut();
        setError("This account does not have administrator access.");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a1126] px-4 py-8 sm:py-12">

      {/* Background */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#17306b_0%,#0a1126_65%)]" />

        <div className="absolute -left-40 -top-40 h-[36rem] w-[36rem] animate-drift rounded-full bg-blue-600/40 blur-[110px]" />

        <div className="absolute -bottom-48 -right-32 h-[34rem] w-[34rem] animate-drift rounded-full bg-indigo-500/40 blur-[110px] [animation-delay:-7s]" />

        <div className="absolute left-[38%] top-[35%] h-80 w-80 animate-drift rounded-full bg-cyan-400/20 blur-[100px] [animation-delay:-13s]" />

        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage:
              "radial-gradient(ellipse at center, black, transparent 75%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at center, black, transparent 75%)",
          }}
        />

        {TILES.map(({ icon: Icon, style, size, delay }, i) => (
          <div
            key={i}
            className="absolute hidden animate-float items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-blue-100 shadow-2xl shadow-black/30 backdrop-blur-md md:flex"
            style={{
              ...style,
              width: size,
              height: size,
              animationDelay: delay,
            }}
          >
            <Icon size={size * 0.42} />
          </div>
        ))}
      </div>

      {/* Login content */}
      <div className="relative z-10 w-full max-w-md animate-rise">

        {/* Full-size Diamond Elite Club logo */}
        <div className="mb-7 flex flex-col items-center text-center">

          <div className="relative h-64 w-full sm:h-80">
            <Image
              src="/diamond-elite-logo.jpeg"
              alt="Diamond Elite Club"
              fill
              priority
              sizes="(max-width: 640px) 100vw, 448px"
              className="object-contain"
            />
          </div>

          <p className="mt-2 text-sm tracking-[0.18em] text-blue-100/80">
            {APP_TAGLINE}
          </p>
        </div>

        {/* Login card */}
        <div className="rounded-3xl bg-white/95 p-7 shadow-2xl shadow-black/40 ring-1 ring-white/30 backdrop-blur sm:p-8">

          <h2 className="font-[family-name:var(--font-display)] text-2xl text-slate-900">
            Welcome back
          </h2>

          <p className="mb-6 mt-1 text-sm text-slate-500">
            Sign in to continue to your dashboard.
          </p>

          <form onSubmit={onSubmit} className="space-y-5" noValidate>

            {/* Email */}
            <label className="block text-sm font-medium text-slate-700">
              Email

              <span className="relative block">
                <Mail
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 mt-0.5 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={`${input} pl-10`}
                />
              </span>
            </label>

            {/* Password */}
            <label className="block text-sm font-medium text-slate-700">
              Password

              <span className="relative block">
                <Lock
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 mt-0.5 -translate-y-1/2 text-slate-400"
                />

                <input
                  type={show ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${input} pl-10 pr-12`}
                />

                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? "Hide password" : "Show password"}
                  className="absolute right-1 top-1/2 mt-0.5 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 hover:text-slate-800"
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>

            {/* Error */}
            {error && (
              <p
                role="alert"
                className="flex items-center gap-2 rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-700 ring-1 ring-red-600/10 break-words"
              >
                <AlertCircle size={16} className="shrink-0" />
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email.trim() || !password}
              className={`${btnPrimary} w-full py-3 text-base`}
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? "Signing in…" : "Sign in"}
            </button>

          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 flex items-center justify-center gap-2 text-sm text-blue-100/60">
          <ShieldCheck size={16} />
          Private, administrator-only access
        </p>

      </div>
    </main>
  );
}
