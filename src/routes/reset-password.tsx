import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AuthShell, Field, authInputCls } from "@/components/AuthShell";
import { resetSchema } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  component: Reset,
  head: () => ({ meta: [{ title: "Set new password — CorridorX" }] }),
});

function Reset() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase places the recovery session in the URL hash — verify a session exists.
    supabase.auth.getSession().then(({ data }) => setReady(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = resetSchema.safeParse({ password });
    if (!parsed.success) { setError(parsed.error.issues[0].message); return; }
    setError(undefined);
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated");
    navigate({ to: "/app" });
  }

  return (
    <AuthShell
      title="Set a new password"
      footer={<Link to="/login" className="text-primary hover:underline">Back to sign in</Link>}
    >
      {!ready ? (
        <p className="text-sm text-muted-foreground">
          This link is invalid or has expired. <Link to="/forgot-password" className="text-primary hover:underline">Request a new one</Link>.
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="New password" error={error}>
            <input type="password" className={authInputCls} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
          </Field>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Updating…" : "Update password"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
