import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const RegistrationSchema = z.object({
  fullname: z.string().trim().min(2, "Full name is required").max(120),
  email: z
    .string()
    .trim()
    .max(255)
    .email("Invalid email")
    .optional()
    .or(z.literal("")),
  phone: z.string().trim().min(5, "Phone is required").max(40),
  church: z.enum(["Church 1", "Church 2"]),
  cell: z.string().trim().min(1, "Cell is required").max(120),
});

export const submitRegistration = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => RegistrationSchema.parse(data))
  .handler(async ({ data }) => {
    const { getSupabaseAdmin } = await import("./supabase.server");
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("conference_registrations").insert({
      fullname: data.fullname,
      email: data.email || null,
      phone: data.phone,
      church: data.church,
      cell: data.cell,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
