"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3, Bell, BookOpenCheck, Building2, CalendarDays, ChevronDown, CircleDollarSign,
  ClipboardCheck, FileClock, FileText, LayoutDashboard, LogOut, Menu, PackageOpen, ReceiptText,
  Search, Settings2, ShieldCheck, ShoppingCart, Store, Truck, UserCog, Users, X,
} from "lucide-react";
import { api, getToken, setToken } from "@/lib/api";
import { modules } from "@/lib/modules";
import type { CurrentUser } from "@/lib/types";
import { AccessScreen } from "./access-screen";
import { AuditScreen } from "./audit-screen";
import { AuthScreen } from "./auth-screen";
import { DashboardScreen } from "./dashboard-screen";
import { ModuleScreen } from "./module-screen";
import { ReportsScreen } from "./reports-screen";

const iconMap: Record<string, React.ElementType> = {
  dashboard: LayoutDashboard, hr: Building2, employees: Users, payroll: ReceiptText,
  attendance: ClipboardCheck, leave: CalendarDays, inventory: PackageOpen, suppliers: Truck,
  purchasing: FileText, customers: Store, sales: ShoppingCart, finance: CircleDollarSign,
  reports: BarChart3, audit: FileClock, access: UserCog,
};

type NavItem = { key: string; title: string; permission: string };

export function ErpApp() {
  const [connecting, setConnecting] = useState(true);
  const [requiresSetup, setRequiresSetup] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [startupError, setStartupError] = useState("");
  const [retryAttempt, setRetryAttempt] = useState(1);
  const [retryVersion, setRetryVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let requestTimer: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | undefined;

    const pause = (milliseconds: number) =>
      new Promise<void>((resolve) => {
        retryTimer = setTimeout(resolve, milliseconds);
      });

    async function bootstrap() {
      let attempt = 1;
      setConnecting(true);
      setStartupError("");

      while (!cancelled) {
        setRetryAttempt(attempt);
        controller = new AbortController();
        requestTimer = setTimeout(() => controller?.abort(), 14_000);

        try {
          const status = await api<{ requiresSetup: boolean }>("/auth/setup-status", { signal: controller.signal });
          if (cancelled) return;
          setRequiresSetup(status.requiresSetup);
          if (getToken() && !status.requiresSetup) {
            try { setUser(await api<CurrentUser>("/auth/me")); }
            catch { setToken(null); setUser(null); }
          }
          setConnecting(false);
          setStartupError("");
          return;
        } catch (caught) {
          if (cancelled) return;
          setStartupError(caught instanceof Error ? caught.message : "Unable to connect to the ERP API.");
          await pause(Math.min(2_500 + attempt * 1_250, 8_000));
          attempt += 1;
        } finally {
          clearTimeout(requestTimer);
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
      controller?.abort();
      clearTimeout(retryTimer);
      clearTimeout(requestTimer);
    };
  }, [retryVersion]);

  if (!user) return (
    <AuthScreen
      requiresSetup={requiresSetup}
      connecting={connecting}
      connectionError={startupError}
      retryAttempt={retryAttempt}
      onRetry={() => setRetryVersion((value) => value + 1)}
      onAuthenticated={setUser}
    />
  );
  return <AppShell user={user} onLogout={() => { setToken(null); setUser(null); }} />;
}

function AppShell({ user, onLogout }: { user: CurrentUser; onLogout: () => void }) {
  const nav = useMemo<NavItem[]>(() => [
    { key: "dashboard", title: "Dashboard", permission: "dashboard.view" },
    ...modules.map(({ key, title, permission }) => ({ key, title, permission })),
    { key: "reports", title: "Reports & analytics", permission: "reports.view" },
    { key: "audit", title: "Audit logs", permission: "audit.view" },
    { key: "access", title: "User access", permission: "users.manage" },
  ].filter((item) => user.permissions.includes(item.permission)), [user.permissions]);
  const [active, setActive] = useState(nav[0]?.key ?? "");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const activeTitle = nav.find((item) => item.key === active)?.title ?? "Workspace";

  function navigate(key: string) { setActive(key); setMobileOpen(false); setSearchOpen(false); }

  return (
    <div className="min-h-screen bg-[#f3f6fb] text-slate-900 lg:grid lg:grid-cols-[264px_1fr]">
      {mobileOpen && <button className="fixed inset-0 z-30 bg-slate-950/35 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col bg-[#0f2747] text-white transition-transform lg:sticky lg:top-0 lg:h-screen ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="flex h-20 items-center justify-between border-b border-white/8 px-5">
          <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-[#55d7f3] text-[#0f2747]"><Building2 className="size-5" /></span><div><p className="font-semibold tracking-tight">Northstar ERP</p><p className="text-[11px] text-white/40">Enterprise suite</p></div></div>
          <button className="p-1 text-white/60 lg:hidden" onClick={() => setMobileOpen(false)}><X className="size-5" /></button>
        </div>
        <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[.2em] text-white/30">Workspace</p>
          <div className="space-y-1">
            {nav.map((item) => {
              const Icon = iconMap[item.key] ?? BookOpenCheck;
              return <button key={item.key} onClick={() => navigate(item.key)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${active === item.key ? "bg-white/11 font-semibold text-white" : "text-white/58 hover:bg-white/6 hover:text-white"}`}><Icon className={`size-[18px] ${active === item.key ? "text-[#55d7f3]" : ""}`} />{item.title}</button>;
            })}
          </div>
        </nav>
        <div className="border-t border-white/8 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/6 p-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#55d7f3] text-sm font-bold text-[#173b67]">{initials(user.fullName)}</span><div className="min-w-0"><p className="truncate text-sm font-medium">{user.fullName}</p><p className="truncate text-[11px] text-white/40">{user.role}</p></div></div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200/80 bg-[#f3f6fb]/95 px-4 backdrop-blur sm:px-7 lg:px-9">
          <div className="flex items-center gap-3"><button onClick={() => setMobileOpen(true)} className="icon-button lg:hidden" aria-label="Open navigation"><Menu className="size-5" /></button><div><p className="text-[11px] font-semibold uppercase tracking-[.16em] text-slate-400">Northstar</p><p className="font-semibold text-slate-800">{activeTitle}</p></div></div>
          <div className="relative flex items-center gap-2">
            <button onClick={() => setSearchOpen((value) => !value)} className="icon-button" aria-label="Search modules"><Search className="size-[18px]" /></button>
            <button onClick={() => navigate("audit")} className="icon-button" aria-label="Open activity"><Bell className="size-[18px]" /></button>
            <button onClick={() => setProfileOpen((value) => !value)} className="ml-1 flex items-center gap-2 rounded-xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-2.5 text-left">
              <span className="flex size-8 items-center justify-center rounded-lg bg-[#173b67] text-xs font-bold text-white">{initials(user.fullName)}</span><span className="hidden text-sm font-medium sm:block">{user.fullName.split(" ")[0]}</span><ChevronDown className="size-3.5 text-slate-400" />
            </button>
            {searchOpen && <div className="absolute right-12 top-12 w-72 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl"><p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Go to module</p>{nav.map((item) => <button key={item.key} onClick={() => navigate(item.key)} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-slate-600 hover:bg-slate-50">{(() => { const Icon = iconMap[item.key] ?? Settings2; return <Icon className="size-4 text-slate-400" />; })()}{item.title}</button>)}</div>}
            {profileOpen && <div className="absolute right-0 top-12 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"><div className="border-b border-slate-100 px-3 py-3"><p className="truncate text-sm font-semibold">{user.fullName}</p><p className="mt-0.5 truncate text-xs text-slate-400">{user.email}</p></div><div className="px-3 py-2 text-xs text-slate-400"><div className="flex items-center gap-2"><ShieldCheck className="size-3.5" />{user.role}</div></div><button onClick={onLogout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-rose-600 hover:bg-rose-50"><LogOut className="size-4" />Sign out</button></div>}
          </div>
        </header>
        <main className="mx-auto max-w-[1500px] px-4 py-7 sm:px-7 lg:px-9 lg:py-9">
          {active === "dashboard" && <DashboardScreen user={user} />}
          {modules.map((module) => active === module.key && <ModuleScreen key={module.key} config={module} />)}
          {active === "reports" && <ReportsScreen />}
          {active === "audit" && <AuditScreen />}
          {active === "access" && <AccessScreen />}
          {!active && <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">No modules have been assigned to this account.</div>}
        </main>
      </div>
    </div>
  );
}

function initials(name: string) { return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase(); }
