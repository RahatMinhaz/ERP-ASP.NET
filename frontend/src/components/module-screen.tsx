"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { api } from "@/lib/api";
import type { ErpRecord, FormField, ModuleConfig, RecordValue, TableColumn } from "@/lib/types";

type RelationOption = { id: string; label?: string; name?: string; fullName?: string };

export function ModuleScreen({ config }: { config: ModuleConfig }) {
  const [records, setRecords] = useState<ErpRecord[]>([]);
  const [relations, setRelations] = useState<Record<string, RelationOption[]>>({});
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editor, setEditor] = useState<ErpRecord | null | undefined>(undefined);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setRecords(await api<ErpRecord[]>(config.endpoint));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load records.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    api<ErpRecord[]>(config.endpoint)
      .then(setRecords)
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to load records."))
      .finally(() => setLoading(false));
  }, [config.endpoint]);

  useEffect(() => {
    const relationFields = config.fields.filter((field) => field.type === "relation" && field.relationEndpoint);
    Promise.all(relationFields.map(async (field) => [field.key, await api<RelationOption[]>(field.relationEndpoint!)] as const))
      .then((entries) => setRelations(Object.fromEntries(entries)))
      .catch(() => setRelations({}));
  }, [config]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return records;
    return records.filter((record) => config.columns.some((column) => displayValue(record, column).toLowerCase().includes(normalized)));
  }, [config.columns, query, records]);

  async function remove(record: ErpRecord) {
    if (!window.confirm(`Delete this ${config.singular}? This action cannot be undone.`)) return;
    setError("");
    try {
      await api<void>(`${config.endpoint}/${record.id}`, { method: "DELETE" });
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to delete record.");
    }
  }

  return (
    <section>
      <header className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Operations</p>
          <h1 className="page-title">{config.title}</h1>
          <p className="page-copy">{config.description}</p>
        </div>
        <button onClick={() => setEditor(null)} className="primary-button shrink-0"><Plus className="size-4" />Add {config.singular}</button>
      </header>

      {error && <div className="mb-5 flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><AlertCircle className="size-4 shrink-0" />{error}</div>}

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
          <div><p className="font-semibold text-slate-800">All records</p><p className="mt-0.5 text-xs text-slate-400">{records.length} total</p></div>
          <label className="relative block sm:w-72">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} className="field h-10 pl-9" aria-label={`Search ${config.title}`} placeholder="Search records" />
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-[#fafbf9] text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <tr>{config.columns.map((column) => <th key={column.key} className="whitespace-nowrap px-5 py-3.5">{column.label}</th>)}<th className="px-5 py-3.5 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!loading && filtered.map((record) => (
                <tr key={record.id} className="transition hover:bg-slate-50/70">
                  {config.columns.map((column) => <td key={column.key} className="max-w-72 whitespace-nowrap px-5 py-4 text-slate-600">{renderValue(record, column)}</td>)}
                  <td className="whitespace-nowrap px-5 py-3 text-right">
                    <button onClick={() => setEditor(record)} className="icon-button" aria-label={`Edit ${config.singular}`}><Pencil className="size-4" /></button>
                    <button onClick={() => void remove(record)} className="icon-button ml-1 hover:text-rose-600" aria-label={`Delete ${config.singular}`}><Trash2 className="size-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && <div className="py-16 text-center text-sm text-slate-400">Loading records…</div>}
          {!loading && filtered.length === 0 && (
            <div className="px-6 py-16 text-center">
              <p className="font-medium text-slate-700">{query ? "No matching records" : `No ${config.title.toLowerCase()} yet`}</p>
              <p className="mt-1 text-sm text-slate-400">{query ? "Try another search term." : `Add the first ${config.singular} when you are ready.`}</p>
            </div>
          )}
        </div>
      </div>

      {editor !== undefined && (
        <RecordEditor
          config={config}
          record={editor}
          relations={relations}
          onClose={() => setEditor(undefined)}
          onSaved={async () => { setEditor(undefined); await load(); }}
        />
      )}
    </section>
  );
}

function RecordEditor({ config, record, relations, onClose, onSaved }: {
  config: ModuleConfig;
  record: ErpRecord | null;
  relations: Record<string, RelationOption[]>;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [values, setValues] = useState<Record<string, RecordValue>>(() => Object.fromEntries(config.fields.map((field) => [
    field.key, record?.[field.key] ?? (field.type === "number" ? 0 : field.options?.[0] ?? "")
  ])));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const payload = Object.fromEntries(config.fields.map((field) => {
      let value = values[field.key];
      if (field.type === "number") value = Number(value || 0);
      if (field.type === "time" && value && String(value).length === 5) value = `${value}:00`;
      if (!field.required && value === "") value = null;
      return [field.key, value];
    }));
    try {
      await api(record ? `${config.endpoint}/${record.id}` : config.endpoint, {
        method: record ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      await onSaved();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save record.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end bg-slate-950/35 p-0 backdrop-blur-[2px] sm:p-4" role="dialog" aria-modal="true">
      <div className="flex h-full w-full flex-col bg-white shadow-2xl sm:max-w-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div><p className="eyebrow">{record ? "Edit record" : "New record"}</p><h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">{record ? `Update ${config.singular}` : `Add ${config.singular}`}</h2></div>
          <button onClick={onClose} className="icon-button" aria-label="Close editor"><X className="size-5" /></button>
        </div>
        <form onSubmit={save} className="flex min-h-0 flex-1 flex-col">
          <div className="grid flex-1 content-start gap-5 overflow-y-auto px-6 py-6 sm:grid-cols-2">
            {config.fields.map((field) => (
              <Field key={field.key} field={field} value={values[field.key]} options={relations[field.key] ?? []}
                onChange={(value) => setValues((current) => ({ ...current, [field.key]: value }))} />
            ))}
            {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 sm:col-span-2">{error}</p>}
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
            <button type="button" onClick={onClose} className="secondary-button">Cancel</button>
            <button disabled={busy} className="primary-button">{busy ? "Saving…" : record ? "Save changes" : "Create record"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ field, value, options, onChange }: { field: FormField; value: RecordValue; options: RelationOption[]; onChange: (value: string) => void }) {
  const common = { value: String(value ?? ""), onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => onChange(event.target.value), required: field.required, className: "field mt-2" };
  return (
    <label className={`block text-sm font-medium text-slate-700 ${field.type === "textarea" ? "sm:col-span-2" : ""}`}>
      {field.label}{field.required && <span className="ml-1 text-rose-500">*</span>}
      {field.type === "textarea" ? <textarea {...common} rows={4} /> :
        field.type === "select" ? <select {...common}>{field.options?.map((option) => <option key={option}>{option}</option>)}</select> :
        field.type === "relation" ? <select {...common}><option value="">Select {field.label.toLowerCase()}</option>{options.map((option) => <option key={option.id} value={option.id}>{option.label ?? option.name ?? option.fullName}</option>)}</select> :
        <input {...common} type={field.type} step={field.step} />}
    </label>
  );
}

function displayValue(record: ErpRecord, column: TableColumn) {
  const raw = column.nested ? (record[column.key] as Record<string, unknown> | null)?.[column.nested] : record[column.key];
  if (raw === null || raw === undefined || raw === "") return "—";
  if (column.format === "currency") return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(Number(raw));
  if (column.format === "date") return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(`${String(raw).slice(0, 10)}T00:00:00`));
  if (column.format === "datetime") return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(String(raw)));
  return String(raw);
}

function renderValue(record: ErpRecord, column: TableColumn) {
  const value = displayValue(record, column);
  if (column.format !== "status" || value === "—") return value;
  return <span className="inline-flex rounded-full bg-[#edf2df] px-2.5 py-1 text-xs font-semibold text-[#3e5e3c]">{value}</span>;
}
