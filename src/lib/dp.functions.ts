import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const DpSchema = z.object({
  fullname: z.string().trim().max(120).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
});

export const trackDpGenerated = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => DpSchema.parse(data ?? {}))
  .handler(async ({ data }) => {
    const { getSupabaseAdmin } = await import("./supabase.server");
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("dp_generations").insert({
      fullname: data.fullname || null,
      phone: data.phone || null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
