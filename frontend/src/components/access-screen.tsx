"use client";

import { useEffect, useState } from "react";
import { Plus, Shield, UserCheck, X } from "lucide-react";
import { api } from "@/lib/api";

type UserRow = { id: string; fullName: string; email: string; role: string; isActive: boolean; permissions: string[]; createdAtUtc: string };
type Options = { roles: string[]; permissions: string[] };

const permissionNames: Record<string, string> = {
  "dashboard.view": "Dashboard", "hr.manage": "HR management", "employees.manage": "Employees",
  "payroll.manage": "Payroll", "attendance.manage": "Attendance", "leave.manage": "Leave",
  "inventory.manage": "Inventory", "sales.manage": "Sales", "purchasing.manage": "Purchasing",
  "finance.manage": "Finance", "reports.view": "Reports", "audit.view": "Audit logs", "users.manage": "User access",
};

export function AccessScreen() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [options, setOptions] = useState<Options>({ roles: [], permissions: [] });
  const [selected, setSelected] = useState<UserRow | null | undefined>(undefined);
  const [error, setError] = useState("");

  async function load() {
    try {
      const [userRows, optionRows] = await Promise.all([api<UserRow[]>("/users"), api<Options>("/users/options")]);
      setUsers(userRows); setOptions(optionRows);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to load access settings."); }
  }
  useEffect(() => {
    Promise.all([api<UserRow[]>("/users"), api<Options>("/users/options")])
      .then(([userRows, optionRows]) => { setUsers(userRows); setOptions(optionRows); })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to load access settings."));
  }, []);

  return (
    <section>
      <header className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><p className="eyebrow">Administration</p><h1 className="page-title">User access</h1><p className="page-copy">Create accounts and assign claims for each area of the ERP.</p></div>
        <button onClick={() => setSelected(null)} className="primary-button"><Plus className="size-4" />Add user</button>
      </header>
      {error && <p className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
        <div className="border-b border-slate-100 px-5 py-4"><p className="font-semibold text-slate-800">Accounts</p><p className="mt-0.5 text-xs text-slate-400">{users.length} total</p></div>
        <div className="divide-y divide-slate-100">
          {users.map((user) => (
            <button key={user.id} onClick={() => setSelected(user)} className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-slate-50">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e6f1fb] font-semibold text-[#245a8d]">{initials(user.fullName)}</span>
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-800">{user.fullName}</span><span className="mt-0.5 block truncate text-xs text-slate-400">{user.email}</span></span>
              <span className="hidden text-sm text-slate-500 sm:block">{user.role}</span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${user.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{user.isActive ? "Active" : "Inactive"}</span>
            </button>
          ))}
          {!users.length && <p className="px-5 py-12 text-center text-sm text-slate-400">No user accounts found.</p>}
        </div>
      </div>
      <p className="mt-4 text-xs text-slate-400">Permission changes take effect the next time the user signs in.</p>
      {selected !== undefined && <AccessEditor user={selected} options={options} onClose={() => setSelected(undefined)} onSaved={async () => { setSelected(undefined); await load(); }} />}
    </section>
  );
}

function AccessEditor({ user, options, onClose, onSaved }: { user: UserRow | null; options: Options; onClose: () => void; onSaved: () => Promise<void> }) {
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(user?.role ?? options.roles[0] ?? "Employee");
  const [permissions, setPermissions] = useState<string[]>(user?.permissions ?? ["dashboard.view"]);
  const [active, setActive] = useState(user?.isActive ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      if (user) await api(`/users/${user.id}/access`, { method: "PUT", body: JSON.stringify({ role, permissions, isActive: active }) });
      else await api("/users", { method: "POST", body: JSON.stringify({ fullName, email, password, role, permissions }) });
      await onSaved();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to save user."); }
    finally { setBusy(false); }
  }

  function toggle(permission: string) {
    setPermissions((current) => current.includes(permission) ? current.filter((item) => item !== permission) : [...current, permission]);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end bg-slate-950/35 p-0 backdrop-blur-[2px] sm:p-4">
      <div className="flex h-full w-full flex-col bg-white shadow-2xl sm:max-w-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div><p className="eyebrow">{user ? "Access policy" : "New account"}</p><h2 className="mt-1 text-xl font-semibold">{user ? user.fullName : "Add a user"}</h2></div>
          <button onClick={onClose} className="icon-button" aria-label="Close"><X className="size-5" /></button>
        </div>
        <form onSubmit={save} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {!user && <div className="mb-6 grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">Full name<input className="field mt-2" value={fullName} onChange={(e) => setFullName(e.target.value)} required /></label>
              <label className="text-sm font-medium text-slate-700">Work email<input className="field mt-2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
              <label className="text-sm font-medium text-slate-700 sm:col-span-2">Temporary password<input className="field mt-2" type="password" minLength={10} value={password} onChange={(e) => setPassword(e.target.value)} required /><span className="mt-1.5 block text-xs font-normal text-slate-400">At least 10 characters.</span></label>
            </div>}
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">Role<select className="field mt-2" value={role} onChange={(e) => setRole(e.target.value)}>{options.roles.map((item) => <option key={item}>{item}</option>)}</select></label>
              {user && <label className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3.5 text-sm font-medium text-slate-700">Account active<input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="size-4 accent-[#173b67]" /></label>}
            </div>
            <div className="mt-7"><div className="flex items-center gap-2"><Shield className="size-4 text-[#3f6f9f]" /><h3 className="text-sm font-semibold text-slate-800">Claims and permissions</h3></div><p className="mt-1 text-xs text-slate-400">Only selected areas appear for this user, and the API enforces the same restrictions.</p></div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">{options.permissions.map((permission) => (
              <label key={permission} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 text-sm transition ${permissions.includes(permission) ? "border-[#72b8dc] bg-[#edf7fc] text-[#244f7c]" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                <input type="checkbox" checked={permissions.includes(permission)} onChange={() => toggle(permission)} className="size-4 accent-[#173b67]" />
                {permissionNames[permission] ?? permission}
              </label>
            ))}</div>
            {error && <p className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4"><button type="button" onClick={onClose} className="secondary-button">Cancel</button><button disabled={busy} className="primary-button"><UserCheck className="size-4" />{busy ? "Saving…" : "Save access"}</button></div>
        </form>
      </div>
    </div>
  );
}

function initials(name: string) { return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase(); }
