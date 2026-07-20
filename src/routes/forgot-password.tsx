import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AuthShell, Field, authInputCls } from "@/components/AuthShell";
import { emailSchema } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({
  component: Forgot,
  head: () => ({ meta: [{ title: "Reset password — CorridorX" }] }),
});

function Forgot() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = emailSchema.safeParse({ email });
    if (!parsed.success) { setError(parsed.error.issues[0].message); return; }
    setError(undefined);
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setSent(true);
  }

  return (
    <AuthShell
      title="Forgot password"
      subtitle="We'll email you a secure reset link."
      footer={<Link to="/login" className="text-primary hover:underline">Back to sign in</Link>}
    >
      {sent ? (
        <p className="text-sm text-muted-foreground">
          If an account exists for <span className="text-foreground">{email}</span>, a reset link is on its way.
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="Email" error={error}>
            <input type="email" className={authInputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
