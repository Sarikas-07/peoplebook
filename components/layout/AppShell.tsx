"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3, BookOpen, FileText, IndianRupee, LayoutDashboard, LogOut, Menu, MessageSquare, Settings, Users, X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { APP_NAME, APP_TAGLINE, NAV_ITEMS } from "@/lib/constants";

const ICONS = { LayoutDashboard, Users, FileText, IndianRupee, BarChart3, MessageSquare };

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open]);

  async function logout() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const link = (active: boolean) =>
    `group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
      active ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-950/50" : "text-slate-400 hover:bg-white/5 hover:text-white"
    }`;
  const bar = (active: boolean) => { void active; return null; };

  const nav = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-6 py-6">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-900/40">
          <BookOpen size={20} />
        </span>
        <div>
          <p className="font-[family-name:var(--font-display)] text-xl font-semibold leading-none text-white">{APP_NAME}</p>
          <p className="mt-1 text-xs text-slate-400">{APP_TAGLINE}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const Icon = ICONS[item.icon];
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={link(active)}
              aria-current={active ? "page" : undefined}>
              {bar(active)}
              <Icon size={18} className={active ? "text-white" : "text-slate-500 group-hover:text-slate-300"} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mx-3 space-y-1 border-t border-white/10 py-4">
        <Link href="/settings" onClick={() => setOpen(false)} className={link(isActive("/settings"))}>
          {bar(isActive("/settings"))}
          <Settings size={18} className={isActive("/settings") ? "text-white" : "text-slate-500 group-hover:text-slate-300"} />
          Settings
        </Link>
        <button onClick={logout} className={`${link(false)} w-full hover:!text-red-300`}>
          <LogOut size={18} className="text-slate-500 group-hover:text-red-300" /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-64 bg-gradient-to-b from-[#0d1833] via-[#101a30] to-[#080e1f] shadow-xl shadow-slate-900/20 lg:block">{nav}</aside>

      <header className="sticky top-0 z-30 flex items-center justify-between bg-[#101a30] px-4 py-2 shadow-md lg:hidden">
        <span className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white"><BookOpen size={16} /></span>
          <span className="font-[family-name:var(--font-display)] text-lg font-semibold text-white">{APP_NAME}</span>
        </span>
        <button onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open}
          className="-mr-2 flex h-11 w-11 items-center justify-center text-white"><Menu size={22} /></button>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-[#101a30] shadow-2xl">
            <button onClick={() => setOpen(false)} aria-label="Close menu"
              className="absolute right-2 top-3 flex h-11 w-11 items-center justify-center text-white"><X size={20} /></button>
            {nav}
          </aside>
        </div>
      )}

      <main className="lg:pl-64">
        <div key={pathname} className="mx-auto min-w-0 max-w-6xl animate-rise p-4 sm:p-6 lg:p-10">{children}</div>
      </main>
    </div>
  );
}
