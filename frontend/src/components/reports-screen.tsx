"use client";

import { useEffect, useState } from "react";
import { BarChart3, CircleDollarSign, Package, ShoppingBag } from "lucide-react";
import { api } from "@/lib/api";

type Group = { label: string; count: number; amount?: number; value?: number };
type Reports = {
  payroll: Group[]; leave: Group[]; inventory: Group[]; sales: Group[]; purchasing: Group[];
  finance: { debit: number; credit: number };
};
const money = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" });

export function ReportsScreen() {
  const [data, setData] = useState<Reports | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { api<Reports>("/reports").then(setData).catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to load reports.")); }, []);
  if (error) return <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p>;

  const sections = [
    { title: "Sales by status", rows: data?.sales ?? [], key: "amount", icon: ShoppingBag },
    { title: "Purchasing by status", rows: data?.purchasing ?? [], key: "amount", icon: BarChart3 },
    { title: "Inventory by category", rows: data?.inventory ?? [], key: "value", icon: Package },
    { title: "Payroll by status", rows: data?.payroll ?? [], key: "amount", icon: CircleDollarSign },
  ] as const;
  return (
    <section>
      <header className="mb-8"><p className="eyebrow">Decision support</p><h1 className="page-title">Reports & analytics</h1><p className="page-copy">Aggregations are calculated from current SQL Server records.</p></header>
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <article className="rounded-2xl border border-slate-200/80 bg-white p-6"><p className="text-sm text-slate-500">Journal debits</p><p className="mt-3 text-3xl font-semibold tracking-tight">{money.format(data?.finance.debit ?? 0)}</p></article>
        <article className="rounded-2xl border border-slate-200/80 bg-white p-6"><p className="text-sm text-slate-500">Journal credits</p><p className="mt-3 text-3xl font-semibold tracking-tight">{money.format(data?.finance.credit ?? 0)}</p></article>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        {sections.map((section) => (
          <article key={section.title} className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4"><span className="flex size-9 items-center justify-center rounded-xl bg-[#e7f3fb] text-[#245a8d]"><section.icon className="size-4" /></span><h2 className="font-semibold text-slate-800">{section.title}</h2></div>
            {section.rows.length ? <div className="divide-y divide-slate-100">{section.rows.map((row) => (
              <div key={row.label} className="flex items-center justify-between px-5 py-4 text-sm"><div><p className="font-medium text-slate-700">{row.label}</p><p className="mt-0.5 text-xs text-slate-400">{row.count} record{row.count === 1 ? "" : "s"}</p></div><strong className="text-slate-700">{money.format(Number(row[section.key] ?? 0))}</strong></div>
            ))}</div> : <p className="px-5 py-10 text-center text-sm text-slate-400">No data available yet.</p>}
          </article>
        ))}
      </div>
    </section>
  );
}
