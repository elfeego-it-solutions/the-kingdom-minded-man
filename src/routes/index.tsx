import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { submitRegistration } from "@/lib/registrations.functions";
import { submitQuestion } from "@/lib/questions.functions";
import heroBanner from "@/assets/site_header_banner_04.png.asset.json";
import { Toaster } from "@/components/ui/sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "CE Men's Conference 2026 · The Kingdom Minded Man",
      },
      {
        name: "description",
        content:
          "Register for CE Karu 1 Men's Conference 2026 — The Kingdom Minded Man | Fri 31 Jul – Sun 2 Aug 2026 | Church 1 Auditorium.",
      },
      {
        property: "og:title",
        content: "CE Men's Conference 2026 · The Kingdom Minded Man",
      },
      {
        property: "og:description",
        content:
          "Register for CE Karu 1 Men's Conference 2026 — The Kingdom Minded Man | Fri 31 Jul – Sun 2 Aug 2026 | Church 1 Auditorium.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const register = useServerFn(submitRegistration);
  const askQuestion = useServerFn(submitQuestion);

  const [submitting, setSubmitting] = useState(false);
  const [questionOpen, setQuestionOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [questionSubmitting, setQuestionSubmitting] = useState(false);

  async function onRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      fullname: String(fd.get("fullname") ?? "").trim(),
      email: String(fd.get("email") ?? "").trim(),
      phone: String(fd.get("phone") ?? "").trim(),
      church: String(fd.get("church") ?? "") as "Church 1" | "Church 2",
      cell: String(fd.get("cell") ?? "").trim(),
    };
    setSubmitting(true);
    try {
      await register({ data: payload });
      try {
        sessionStorage.setItem("mc2026:attendee", JSON.stringify({ fullname: payload.fullname, phone: payload.phone }));
      } catch {
        // ignore storage errors
      }
      toast.success("Registration successful. Let's create your DP!");
      navigate({ to: "/dp" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function onQuestion() {
    if (question.trim().length < 3) {
      toast.error("Please write your question first.");
      return;
    }
    setQuestionSubmitting(true);
    try {
      await askQuestion({ data: { question: question.trim() } });
      toast.success("Your question has been submitted successfully. Thank you.");
      setQuestion("");
      setQuestionOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      toast.error(msg);
    } finally {
      setQuestionSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-center" richColors />

      {/* ---------- HERO BANNER ---------- */}
      <section className="w-full bg-background">
        <div className="mx-auto max-w-[1600px]">
          <img
            src={heroBanner.url}
            alt="Christ Embassy Karu 1 Men's Conference 2026 — The Kingdom Minded Man"
            className="h-auto w-full"
            loading="eager"
            fetchPriority="high"
          />
        </div>
      </section>

      {/* ---------- INTRO STRIP ---------- */}
      <section className="border-y border-border/60 bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-6xl gap-4 px-6 py-6 text-center sm:grid-cols-3 sm:text-left">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-gold">Dates</p>
            <p className="font-display text-xl">Fri 31 Jul – Sun 2 Aug 2026</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-gold">Venue</p>
            <p className="font-display text-xl">Church 1 Auditorium</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-gold">Theme</p>
            <p className="font-display text-xl">The Kingdom Minded Man</p>
          </div>
        </div>
      </section>

      {/* ---------- REGISTRATION ---------- */}
      <section id="register" className="px-6 py-20 sm:py-24" style={{ backgroundColor: "var(--color-cream)" }}>
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <span className="ornament">Registration</span>
            <h2 className="mt-4 font-display text-4xl sm:text-5xl">Register for Men's Conference 2026</h2>
            <p className="mt-3 font-display text-2xl gold-text">The Kingdom Minded Man</p>
            <span className="gold-divider mx-auto mt-6 w-40" />
          </div>

          <form
            onSubmit={onRegister}
            className="mt-10 rounded-2xl border border-border/70 bg-card p-6 shadow-luxe sm:p-10"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Full Name" required>
                <input
                  name="fullname"
                  required
                  minLength={2}
                  maxLength={120}
                  className={inputCls}
                  placeholder="Your Name"
                />
              </Field>

              <Field label="Email Address">
                <input
                  name="email"
                  type="email"
                  maxLength={255}
                  className={inputCls}
                  placeholder="name@example.com (optional)"
                />
              </Field>

              <Field label="Phone Number" required>
                <input name="phone" required minLength={5} maxLength={40} className={inputCls} placeholder="+234 ..." />
              </Field>

              <Field label="Church" required>
                <select name="church" required className={inputCls} defaultValue="">
                  <option value="" disabled>
                    Select Your Church
                  </option>
                  <option value="Church 1">Church 1</option>
                  <option value="Church 2">Church 2</option>
                </select>
              </Field>

              <Field label="Cell" required className="sm:col-span-2">
                <input
                  name="cell"
                  required
                  minLength={1}
                  maxLength={120}
                  className={inputCls}
                  placeholder="Your Cell Name"
                />
              </Field>
            </div>

            <button type="submit" disabled={submitting} className="btn-gold mt-8 w-full rounded-xl px-6 py-4 text-base">
              {submitting ? "Submitting…" : "Submit & Create Personalized DP"}
            </button>
          </form>

          {/* ---------- QUICK DP ACCESS ---------- */}
          <div className="mt-8 rounded-2xl border border-gold bg-card p-6 text-center shadow-elegant sm:p-8">
            <p className="text-xs uppercase tracking-[0.25em] text-gold-deep">Already registered?</p>
            <h3 className="mt-2 font-display text-2xl">Create Your Personalized DP Now!</h3>
            <p className="mt-2 text-sm text-muted-foreground">Skip the form — go straight to the DP Generator.</p>
            <button
              type="button"
              onClick={() => navigate({ to: "/dp" })}
              className="btn-outline-gold mt-5 inline-flex items-center rounded-xl px-6 py-3 text-sm"
            >
              Create Personalized DP
            </button>
          </div>
        </div>
      </section>

      {/* ---------- ANONYMOUS QUESTIONS ---------- */}
      <section className="px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <span className="ornament">Ask</span>
          <h2 className="mt-4 font-display text-4xl sm:text-5xl">Have a Question?</h2>
          <p className="mt-3 text-base text-muted-foreground">
            Submit Your Question. No Name, No eMail — Just Your Question.
          </p>
          <span className="gold-divider mx-auto mt-6 w-40" />
          <button
            type="button"
            onClick={() => setQuestionOpen(true)}
            className="btn-dark mt-8 inline-flex items-center rounded-xl px-8 py-3 text-sm"
          >
            Submit Question
          </button>
        </div>
      </section>

      {/* ---------- FOOTER ---------- */}
      <footer className="border-t border-border/60 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-6xl px-6 py-10 text-center">
          <p className="font-display text-2xl gold-text">The Kingdom Minded Man</p>
          <p className="mt-2 text-sm opacity-80">CE Karu 1 · Men's Conference 2026 · 31 Jul – 2 Aug 2026</p>
          <p className="mt-6 text-xs opacity-60">© {new Date().getFullYear()} CE Karu 1. All rights reserved.</p>
        </div>
      </footer>

      {/* ---------- QUESTION MODAL ---------- */}
      <Dialog open={questionOpen} onOpenChange={setQuestionOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Submit Your Question</DialogTitle>
            <DialogDescription>{"\n"}</DialogDescription>
          </DialogHeader>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={2000}
            rows={6}
            placeholder="Enter Your Question Here…"
            className={`${inputCls} resize-none`}
          />
          <DialogFooter>
            <button
              type="button"
              onClick={() => setQuestionOpen(false)}
              className="btn-outline-gold rounded-lg px-5 py-2.5 text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onQuestion}
              disabled={questionSubmitting}
              className="btn-gold rounded-lg px-5 py-2.5 text-sm"
            >
              {questionSubmitting ? "Submitting…" : "Submit Question"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/40 transition";

function Field({
  label,
  required,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
        {required ? <span className="ml-1 text-gold-deep">*</span> : null}
      </span>
      {children}
    </label>
  );
}
