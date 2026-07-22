import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// -----------------------------------------------------------------------------
// Auth
// -----------------------------------------------------------------------------

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ password: z.string().min(1).max(200) }).parse(data),
  )
  .handler(async ({ data }) => {
    const expected = process.env.ADMIN_PASSWORD;
    if (!expected) throw new Error("ADMIN_PASSWORD not configured");
    if (data.password !== expected) {
      return { ok: false as const, error: "Invalid password" };
    }
    const { issueAdminSession } = await import("./admin-session.server");
    issueAdminSession();
    return { ok: true as const };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  const { clearAdminSession } = await import("./admin-session.server");
  clearAdminSession();
  return { ok: true };
});

export const adminCheck = createServerFn({ method: "GET" }).handler(async () => {
  const { isAdminAuthenticated } = await import("./admin-session.server");
  return { authenticated: isAdminAuthenticated() };
});

// -----------------------------------------------------------------------------
// Data
// -----------------------------------------------------------------------------

async function guard() {
  const { requireAdmin } = await import("./admin-session.server");
  requireAdmin();
  const { getSupabaseAdmin } = await import("./supabase.server");
  return getSupabaseAdmin();
}

export const adminGetAnalytics = createServerFn({ method: "GET" }).handler(
  async () => {
    const supabase = await guard();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const iso = startOfDay.toISOString();

    const [regsTotal, questsTotal, dpsTotal, regsToday, questsToday, dpsToday] =
      await Promise.all([
        supabase
          .from("conference_registrations")
          .select("*", { count: "exact", head: true }),
        supabase
          .from("conference_questions")
          .select("*", { count: "exact", head: true }),
        supabase.from("dp_generations").select("*", { count: "exact", head: true }),
        supabase
          .from("conference_registrations")
          .select("*", { count: "exact", head: true })
          .gte("created_at", iso),
        supabase
          .from("conference_questions")
          .select("*", { count: "exact", head: true })
          .gte("created_at", iso),
        supabase
          .from("dp_generations")
          .select("*", { count: "exact", head: true })
          .gte("generated_at", iso),
      ]);

    return {
      registrations: regsTotal.count ?? 0,
      questions: questsTotal.count ?? 0,
      dps: dpsTotal.count ?? 0,
      registrationsToday: regsToday.count ?? 0,
      questionsToday: questsToday.count ?? 0,
      dpsToday: dpsToday.count ?? 0,
    };
  },
);

export type Registration = {
  id: string;
  fullname: string;
  email: string | null;
  phone: string;
  church: string;
  cell: string;
  created_at: string;
};

export const adminListRegistrations = createServerFn({ method: "GET" }).handler(
  async () => {
    const supabase = await guard();
    const { data, error } = await supabase
      .from("conference_registrations")
      .select("id, fullname, email, phone, church, cell, created_at")
      .order("created_at", { ascending: false })
      .limit(5000);
    if (error) throw new Error(error.message);
    return (data ?? []) as Registration[];
  },
);

export type Question = {
  id: string;
  question: string;
  created_at: string;
};

export const adminListQuestions = createServerFn({ method: "GET" }).handler(
  async () => {
    const supabase = await guard();
    const { data, error } = await supabase
      .from("conference_questions")
      .select("id, question, created_at")
      .order("created_at", { ascending: false })
      .limit(5000);
    if (error) throw new Error(error.message);
    return (data ?? []) as Question[];
  },
);
