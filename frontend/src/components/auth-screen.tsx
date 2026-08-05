"use client";

import { useState } from "react";
import { ArrowRight, Building2, Check, Eye, EyeOff, LoaderCircle, RefreshCw, ShieldCheck } from "lucide-react";
import { api, setToken } from "@/lib/api";
import type { AuthResponse, CurrentUser } from "@/lib/types";

type Props = {
  requiresSetup: boolean;
  connecting: boolean;
  connectionError: string;
  retryAttempt: number;
  onRetry: () => void;
  onAuthenticated: (user: CurrentUser) => void;
};

export function AuthScreen({ requiresSetup, connecting, connectionError, retryAttempt, onRetry, onAuthenticated }: Props) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await api<AuthResponse>(requiresSetup ? "/auth/setup" : "/auth/login", {
        method: "POST",
        body: JSON.stringify(requiresSetup ? { fullName, email, password } : { email, password }),
      });
      setToken(response.token);
      onAuthenticated(response.user);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f3f6fb] text-slate-950">
      <div className="mx-auto grid min-h-screen max-w-[1500px] lg:grid-cols-[1.08fr_.92fr]">
        <section className="relative hidden overflow-hidden bg-[#0f2747] px-14 py-12 text-white lg:flex lg:flex-col">
          <div className="absolute -right-32 top-28 h-96 w-96 rounded-full border border-white/10" />
          <div className="absolute -right-14 top-48 h-64 w-64 rounded-full border border-white/10" />
          <div className="relative flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-[#55d7f3] text-[#0f2747]">
              <Building2 className="size-6" strokeWidth={2.2} />
            </span>
            <div><p className="text-lg font-semibold tracking-tight">Northstar ERP</p><p className="text-xs text-white/55">Enterprise operations</p></div>
          </div>
          <div className="relative my-auto max-w-xl py-16">
            <p className="mb-5 text-xs font-bold uppercase tracking-[.22em] text-[#55d7f3]">One operating system</p>
            <h1 className="text-5xl font-semibold leading-[1.08] tracking-[-.045em] xl:text-6xl">Run every part of the business with clarity.</h1>
            <p className="mt-7 max-w-lg text-lg leading-8 text-white/62">People, inventory, revenue, purchasing, and finance share one secure source of truth.</p>
            <div className="mt-10 grid max-w-lg gap-3 sm:grid-cols-2">
              {["Claims-based access", "Live SQL reporting", "Complete audit trail", "No seeded records"].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-white/78">
                  <span className="flex size-6 items-center justify-center rounded-full bg-white/10"><Check className="size-3.5 text-[#55d7f3]" /></span>{item}
                </div>
              ))}
            </div>
          </div>
          <p className="relative text-xs text-white/35">ASP.NET Core · Next.js · SQL Server</p>
        </section>
        <section className="flex items-center justify-center px-6 py-12 sm:px-12">
          <div className="w-full max-w-md">
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <span className="flex size-10 items-center justify-center rounded-xl bg-[#0f2747] text-[#55d7f3]"><Building2 className="size-5" /></span>
              <span className="font-semibold">Northstar ERP</span>
            </div>
            <span className="mb-6 flex size-12 items-center justify-center rounded-2xl bg-[#dceeff] text-[#244f7c]"><ShieldCheck className="size-6" /></span>
            <p className="text-sm font-semibold text-[#3f6f9f]">{requiresSetup ? "Secure first-run setup" : "Welcome back"}</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-.035em]">{requiresSetup ? "Create the administrator" : "Sign in to your workspace"}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">{requiresSetup ? "The database is empty. This account receives all permissions so you can configure the organization." : "Use the account created by your ERP administrator."}</p>
            {connecting && (
              <div role="status" aria-live="polite" className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-100"><LoaderCircle className="size-4 animate-spin" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">Server is waking up</p>
                    <p className="mt-1 text-xs leading-5 text-amber-700">The free API pauses while idle. Automatic retries are active, and sign-in will unlock when it is ready.</p>
                    <div className="mt-3 flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-[.12em] text-amber-700">
                      <span>Retrying automatically</span><span>Attempt {retryAttempt}</span>
                    </div>
                  </div>
                </div>
                <button type="button" onClick={onRetry} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-white/60 px-3 py-2 text-xs font-semibold text-amber-900 transition hover:bg-white">
                  <RefreshCw className="size-3.5" />Retry now
                </button>
              </div>
            )}
            {!connecting && connectionError && (
              <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                <p className="font-medium">The server is taking longer than expected.</p>
                <p className="mt-1 text-xs leading-5 text-rose-700">{connectionError}</p>
                <button type="button" onClick={onRetry} className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-rose-800">
                  <RefreshCw className="size-3.5" />Try connecting again
                </button>
              </div>
            )}
            <form onSubmit={submit} className="mt-8 space-y-5">
              {requiresSetup && <label className="block text-sm font-medium text-slate-700">Full name<input className="field mt-2" value={fullName} onChange={(e) => setFullName(e.target.value)} required autoComplete="name" /></label>}
              <label className="block text-sm font-medium text-slate-700">Work email<input className="field mt-2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></label>
              <label className="block text-sm font-medium text-slate-700">Password
                <span className="relative mt-2 block">
                  <input className="field pr-12" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={10} autoComplete={requiresSetup ? "new-password" : "current-password"} />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
                </span>
              </label>
              {requiresSetup && <p className="-mt-2 text-xs text-slate-400">Use at least 10 characters.</p>}
              {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
              <button disabled={busy || connecting || Boolean(connectionError)} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#173b67] px-5 text-sm font-semibold text-white transition hover:bg-[#102d52] disabled:cursor-not-allowed disabled:opacity-60">
                {connecting ? "Connecting…" : busy ? "Please wait…" : requiresSetup ? "Create administrator" : "Sign in"}{!busy && !connecting && <ArrowRight className="size-4" />}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
