import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { adminCheck, adminLogin } from "@/lib/admin.functions";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin · Men's Conference 2026" },
      { name: "description", content: "Admin dashboard login." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const login = useServerFn(adminLogin);
  const check = useServerFn(adminCheck);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    check({}).then((r) => {
      if (r.authenticated) navigate({ to: "/admin/dashboard" });
    });
  }, [check, navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await login({ data: { password } });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      navigate({ to: "/admin/dashboard" });
    } catch {
      toast.error("Login failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary px-6 text-primary-foreground">
      <Toaster position="top-center" richColors />
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl border border-gold bg-card p-8 text-foreground shadow-luxe"
      >
        <div className="text-center">
          <span className="ornament">Admin</span>
          <h1 className="mt-3 font-display text-3xl">Dashboard Login</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your admin password to continue.
          </p>
        </div>
        <label className="mt-6 block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Password
          </span>
          <input
            type="password"
            required
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/40"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="btn-gold mt-6 w-full rounded-xl px-6 py-3 text-sm"
        >
          {busy ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}
