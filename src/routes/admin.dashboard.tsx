import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";

import {
  adminCheck,
  adminGetAnalytics,
  adminListQuestions,
  adminListRegistrations,
  adminLogout,
  type Question,
  type Registration,
} from "@/lib/admin.functions";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard · Men's Conference 2026" },
      { name: "description", content: "Registrations, questions, and analytics." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminDashboardPage,
});

type Tab = "analytics" | "registrations" | "questions";

function AdminDashboardPage() {
  const navigate = useNavigate();
  const check = useServerFn(adminCheck);
  const logout = useServerFn(adminLogout);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>("analytics");

  useEffect(() => {
    check({}).then((r) => {
      if (!r.authenticated) navigate({ to: "/admin" });
      else setReady(true);
    });
  }, [check, navigate]);

  const getAnalytics = useServerFn(adminGetAnalytics);
  const getRegs = useServerFn(adminListRegistrations);
  const getQs = useServerFn(adminListQuestions);

  const analytics = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: () => getAnalytics({}),
    enabled: ready,
  });
  const regs = useQuery({
    queryKey: ["admin-regs"],
    queryFn: () => getRegs({}),
    enabled: ready && tab === "registrations",
  });
  const qs = useQuery({
    queryKey: ["admin-qs"],
    queryFn: () => getQs({}),
    enabled: ready && tab === "questions",
  });

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-center" richColors />

      <header className="border-b border-border/60 bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-6 py-4">
          <div className="min-w-0">
            <Link to="/" className="font-display text-xl gold-text">
              Men's Conference 2026 · Admin
            </Link>
          </div>
          <button
            onClick={async () => {
              await logout({});
              navigate({ to: "/admin" });
            }}
            className="btn-outline-gold shrink-0 rounded-lg px-4 py-2 text-xs"
          >
            Sign out
          </button>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2">
          {(
            [
              ["analytics", "Analytics"],
              ["registrations", "Registrations"],
              ["questions", "Questions"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`shrink-0 rounded-t-lg px-4 py-2 text-sm transition ${
                tab === id
                  ? "bg-background text-foreground"
                  : "text-primary-foreground/70 hover:text-gold"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {tab === "analytics" && (
          <AnalyticsView data={analytics.data} loading={analytics.isLoading} />
        )}
        {tab === "registrations" && (
          <RegistrationsView data={regs.data ?? []} loading={regs.isLoading} />
        )}
        {tab === "questions" && (
          <QuestionsView data={qs.data ?? []} loading={qs.isLoading} />
        )}
      </main>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Analytics
// -----------------------------------------------------------------------------

function AnalyticsView({
  data,
  loading,
}: {
  data:
    | {
        registrations: number;
        questions: number;
        dps: number;
        registrationsToday: number;
        questionsToday: number;
        dpsToday: number;
      }
    | undefined;
  loading: boolean;
}) {
  if (loading || !data) return <p className="text-muted-foreground">Loading…</p>;
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <Stat label="Total Registrations" value={data.registrations} />
      <Stat label="Total Questions" value={data.questions} />
      <Stat label="Total DPs Generated" value={data.dps} />
      <Stat label="Today's Registrations" value={data.registrationsToday} today />
      <Stat label="Today's Questions" value={data.questionsToday} today />
      <Stat label="Today's DPs" value={data.dpsToday} today />
    </div>
  );
}

function Stat({
  label,
  value,
  today,
}: {
  label: string;
  value: number;
  today?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-elegant">
      <p className="text-xs uppercase tracking-[0.25em] text-gold-deep">
        {today ? "Today" : "Total"}
      </p>
      <p className="mt-2 font-display text-4xl">{value.toLocaleString()}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Registrations
// -----------------------------------------------------------------------------

function RegistrationsView({
  data,
  loading,
}: {
  data: Registration[];
  loading: boolean;
}) {
  const [q, setQ] = useState("");
  const [church, setChurch] = useState<string>("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return data.filter((r) => {
      if (church && r.church !== church) return false;
      if (!needle) return true;
      return [r.fullname, r.email, r.phone, r.church, r.cell]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle));
    });
  }, [data, q, church]);

  function exportCsv() {
    const rows = filtered.map((r) => ({
      "Full Name": r.fullname,
      Email: r.email ?? "",
      Phone: r.phone,
      Church: r.church,
      Cell: r.cell,
      "Registered At": new Date(r.created_at).toLocaleString(),
    }));
    const csv = Papa.unparse(rows);
    downloadBlob(csv, "registrations.csv", "text/csv;charset=utf-8;");
  }

  function exportXlsx() {
    const rows = filtered.map((r) => ({
      "Full Name": r.fullname,
      Email: r.email ?? "",
      Phone: r.phone,
      Church: r.church,
      Cell: r.cell,
      "Registered At": new Date(r.created_at).toLocaleString(),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Registrations");
    XLSX.writeFile(wb, "registrations.xlsx");
  }

  return (
    <div>
      <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, phone, email, cell…"
          className="rounded-lg border border-input bg-card px-4 py-2.5 text-sm"
        />
        <select
          value={church}
          onChange={(e) => setChurch(e.target.value)}
          className="rounded-lg border border-input bg-card px-4 py-2.5 text-sm"
        >
          <option value="">All churches</option>
          <option value="Church 1">Church 1</option>
          <option value="Church 2">Church 2</option>
        </select>
        <button onClick={exportCsv} className="btn-outline-gold rounded-lg px-4 py-2.5 text-sm">
          Export CSV
        </button>
        <button onClick={exportXlsx} className="btn-gold rounded-lg px-4 py-2.5 text-sm">
          Export Excel
        </button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border/70 bg-card shadow-elegant">
          <table className="w-full text-left text-sm">
            <thead className="bg-primary text-primary-foreground">
              <tr>
                {["Full Name", "Email", "Phone", "Church", "Cell", "Registered"].map(
                  (h) => (
                    <th
                      key={h}
                      className="whitespace-nowrap px-4 py-3 text-xs uppercase tracking-wider text-gold"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-border/60">
                  <td className="whitespace-nowrap px-4 py-3">{r.fullname}</td>
                  <td className="whitespace-nowrap px-4 py-3">{r.email ?? "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3">{r.phone}</td>
                  <td className="whitespace-nowrap px-4 py-3">{r.church}</td>
                  <td className="whitespace-nowrap px-4 py-3">{r.cell}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No registrations yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Questions
// -----------------------------------------------------------------------------

function QuestionsView({ data, loading }: { data: Question[]; loading: boolean }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return data;
    return data.filter((r) => r.question.toLowerCase().includes(needle));
  }, [data, q]);

  function exportCsv() {
    const rows = filtered.map((r) => ({
      Question: r.question,
      "Submitted At": new Date(r.created_at).toLocaleString(),
    }));
    const csv = Papa.unparse(rows);
    downloadBlob(csv, "questions.csv", "text/csv;charset=utf-8;");
  }

  function exportXlsx() {
    const rows = filtered.map((r) => ({
      Question: r.question,
      "Submitted At": new Date(r.created_at).toLocaleString(),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Questions");
    XLSX.writeFile(wb, "questions.xlsx");
  }

  return (
    <div>
      <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search questions…"
          className="rounded-lg border border-input bg-card px-4 py-2.5 text-sm"
        />
        <button onClick={exportCsv} className="btn-outline-gold rounded-lg px-4 py-2.5 text-sm">
          Export CSV
        </button>
        <button onClick={exportXlsx} className="btn-gold rounded-lg px-4 py-2.5 text-sm">
          Export Excel
        </button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-border/70 bg-card p-5 shadow-elegant"
            >
              <p className="whitespace-pre-wrap text-sm text-foreground">
                {r.question}
              </p>
              <p className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">
                {new Date(r.created_at).toLocaleString()}
              </p>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="rounded-xl border border-border/70 bg-card p-8 text-center text-muted-foreground">
              No questions yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function downloadBlob(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
