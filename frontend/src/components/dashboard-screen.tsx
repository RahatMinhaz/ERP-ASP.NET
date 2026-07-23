"use client";

import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Boxes, CalendarCheck, CircleDollarSign, Clock3, FileCheck2, PackageSearch, ShoppingCart, Users } from "lucide-react";
import { api } from "@/lib/api";
import type { CurrentUser } from "@/lib/types";

type Dashboard = {
  employees: number; attendanceToday: number; pendingLeave: number; lowStock: number;
  openSales: number; openPurchases: number; revenue: number; purchasing: number;
  activity: { id: string; action: string; entityName: string; userEmail?: string; createdAtUtc: string }[];
};

const money = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function DashboardScreen({ user }: { user: CurrentUser }) {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Dashboard>("/dashboard").then(setData).catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to load dashboard."));
  }, []);

  if (error) return <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p>;

  const metrics = [
    { label: "Active employees", value: data?.employees ?? "—", detail: `${data?.attendanceToday ?? 0} attendance records today`, icon: Users },
    { label: "Open sales", value: data?.openSales ?? "—", detail: `${money.format(data?.revenue ?? 0)} order value`, icon: ShoppingCart },
    { label: "Open purchases", value: data?.openPurchases ?? "—", detail: `${money.format(data?.purchasing ?? 0)} committed`, icon: FileCheck2 },
    { label: "Low-stock items", value: data?.lowStock ?? "—", detail: `${data?.pendingLeave ?? 0} leave requests pending`, icon: PackageSearch },
  ];

  return (
    <section>
      <header className="mb-8">
        <p className="eyebrow">Business overview</p>
        <h1 className="page-title">Good day, {user.fullName.split(" ")[0]}</h1>
        <p className="page-copy">Live operational signals from your ERP database.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <article key={metric.label} className="rounded-2xl border border-slate-200/80 bg-white p-5">
            <div className="flex items-start justify-between"><p className="text-sm font-medium text-slate-500">{metric.label}</p><span className="flex size-9 items-center justify-center rounded-xl bg-[#eef2e3] text-[#35554b]"><metric.icon className="size-4.5" /></span></div>
            <p className="mt-5 text-3xl font-semibold tracking-[-.04em] text-slate-900">{metric.value}</p>
            <p className="mt-2 text-xs text-slate-400">{metric.detail}</p>
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
        <article className="rounded-2xl border border-slate-200/80 bg-[#143b38] p-6 text-white">
          <div className="flex items-center justify-between">
            <div><p className="text-sm font-medium text-white/60">Commercial position</p><h2 className="mt-1 text-xl font-semibold">Sales and purchasing</h2></div>
            <CircleDollarSign className="size-6 text-[#d9f56f]" />
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="border-l-2 border-[#d9f56f] pl-4">
              <div className="flex items-center gap-2 text-xs text-white/50"><ArrowUpRight className="size-3.5 text-[#d9f56f]" />Sales order value</div>
              <p className="mt-2 text-3xl font-semibold tracking-tight">{money.format(data?.revenue ?? 0)}</p>
            </div>
            <div className="border-l-2 border-white/20 pl-4">
              <div className="flex items-center gap-2 text-xs text-white/50"><ArrowDownRight className="size-3.5" />Purchase commitments</div>
              <p className="mt-2 text-3xl font-semibold tracking-tight">{money.format(data?.purchasing ?? 0)}</p>
            </div>
          </div>
          <div className="mt-8 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-[#d9f56f]" style={{ width: `${ratio(data?.revenue ?? 0, data?.purchasing ?? 0)}%` }} />
          </div>
          <p className="mt-3 text-xs text-white/40">Sales share of combined commercial value</p>
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white p-6">
          <div className="flex items-center justify-between"><div><p className="text-sm font-medium text-slate-500">Workforce today</p><h2 className="mt-1 text-xl font-semibold text-slate-900">Attendance pulse</h2></div><CalendarCheck className="size-5 text-[#487064]" /></div>
          <div className="mt-7 flex items-end gap-3"><span className="text-5xl font-semibold tracking-[-.06em]">{data?.attendanceToday ?? 0}</span><span className="pb-1 text-sm text-slate-400">records today</span></div>
          <div className="mt-7 flex items-center justify-between border-t border-slate-100 pt-4 text-sm"><span className="flex items-center gap-2 text-slate-500"><Clock3 className="size-4" />Pending leave</span><strong>{data?.pendingLeave ?? 0}</strong></div>
        </article>
      </div>

      <article className="mt-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5"><div><p className="font-semibold text-slate-900">Recent activity</p><p className="mt-0.5 text-xs text-slate-400">Latest changes across the system</p></div><Boxes className="size-5 text-slate-400" /></div>
        {data?.activity.length ? <div className="divide-y divide-slate-100">{data.activity.map((item) => (
          <div key={item.id} className="flex items-center gap-4 px-6 py-4">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500"><Clock3 className="size-4" /></span>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-700">{item.action} · {item.entityName}</p><p className="mt-0.5 truncate text-xs text-slate-400">{item.userEmail ?? "System"}</p></div>
            <time className="text-xs text-slate-400">{new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.createdAtUtc))}</time>
          </div>
        ))}</div> : <div className="px-6 py-12 text-center text-sm text-slate-400">Activity will appear after your team starts using the system.</div>}
      </article>
    </section>
  );
}

function ratio(first: number, second: number) {
  if (first + second === 0) return 0;
  return Math.round((first / (first + second)) * 100);
}
