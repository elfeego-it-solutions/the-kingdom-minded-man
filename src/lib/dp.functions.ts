import { createServerFn } from "@tanstack/react-start";

export const trackDpGenerated = createServerFn({ method: "POST" }).handler(
  async () => {
    const { getSupabaseAdmin } = await import("./supabase.server");
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("dp_generations").insert({});
    if (error) throw new Error(error.message);
    return { ok: true };
  },
);
