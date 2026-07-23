"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";

type AuditRow = { id: string; userEmail?: string; action: string; entityName: string; entityId?: string; details?: string; ipAddress?: string; createdAtUtc: string };

export function AuditScreen() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { api<AuditRow[]>("/audit-logs?take=250").then(setRows).catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to load audit logs.")); }, []);
  const filtered = useMemo(() => rows.filter((row) => Object.values(row).some((value) => String(value ?? "").toLowerCase().includes(query.toLowerCase()))), [query, rows]);
  return (
    <section>
      <header className="mb-7"><p className="eyebrow">Governance</p><h1 className="page-title">Audit logs</h1><p className="page-copy">A chronological record of security and business-data changes.</p></header>
      {error && <p className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center"><div className="flex items-center gap-3"><ShieldCheck className="size-5 text-[#487064]" /><div><p className="font-semibold text-slate-800">System events</p><p className="text-xs text-slate-400">{rows.length} captured</p></div></div><label className="relative sm:w-72"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input className="field h-10 pl-9" placeholder="Search audit log" value={query} onChange={(e) => setQuery(e.target.value)} /></label></div>
        <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="border-b border-slate-100 bg-[#fafbf9] text-[11px] uppercase tracking-wider text-slate-400"><tr><th className="px-5 py-3.5">When</th><th className="px-5 py-3.5">User</th><th className="px-5 py-3.5">Action</th><th className="px-5 py-3.5">Entity</th><th className="px-5 py-3.5">Details</th><th className="px-5 py-3.5">IP</th></tr></thead>
          <tbody className="divide-y divide-slate-100">{filtered.map((row) => <tr key={row.id} className="hover:bg-slate-50"><td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">{new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(row.createdAtUtc))}</td><td className="whitespace-nowrap px-5 py-4 text-slate-600">{row.userEmail ?? "System"}</td><td className="px-5 py-4 font-medium text-slate-700">{row.action}</td><td className="px-5 py-4 text-slate-600">{row.entityName}</td><td className="max-w-80 truncate px-5 py-4 text-slate-500">{row.details ?? "—"}</td><td className="whitespace-nowrap px-5 py-4 text-xs text-slate-400">{row.ipAddress ?? "—"}</td></tr>)}</tbody>
        </table>{!filtered.length && <p className="px-5 py-14 text-center text-sm text-slate-400">No audit events match your search.</p>}</div>
      </div>
    </section>
  );
}
