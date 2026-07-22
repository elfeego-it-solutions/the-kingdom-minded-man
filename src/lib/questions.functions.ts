import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const QuestionSchema = z.object({
  question: z.string().trim().min(3, "Question is required").max(2000),
});

export const submitQuestion = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => QuestionSchema.parse(data))
  .handler(async ({ data }) => {
    const { getSupabaseAdmin } = await import("./supabase.server");
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("conference_questions")
      .insert({ question: data.question });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
