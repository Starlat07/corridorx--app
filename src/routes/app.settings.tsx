import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/components/ThemeProvider";

export const Route = createFileRoute("/app/settings")({
  component: Settings,
  head: () => ({ meta: [{ title: "Settings — CorridorX" }] }),
});

function Settings() {
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  async function resetPassword() {
    const { data } = await supabase.auth.getUser();
    if (!data.user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(data.user.email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    if (error) toast.error(error.message);
    else toast.success("Password reset email sent");
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Preferences and account controls.</p>
      </div>

      <Section title="Appearance" desc="Switch between light and dark themes.">
        <div className="flex items-center justify-between">
          <span className="text-sm capitalize">{theme} mode</span>
          <button onClick={toggle} className="btn-ghost">Switch theme</button>
        </div>
      </Section>

      <Section title="Security" desc="Manage your password and session.">
        <div className="flex flex-wrap gap-2">
          <button onClick={resetPassword} className="btn-ghost">Email me a password reset</button>
          <button onClick={signOut} className="btn-ghost">Sign out</button>
        </div>
      </Section>

      <Section title="Notifications" desc="Choose how CorridorX contacts you.">
        <div className="space-y-2 text-sm text-muted-foreground">
          <Toggle label="Transfer status updates" defaultChecked />
          <Toggle label="Favorable FX alerts" defaultChecked />
          <Toggle label="Product newsletters" />
        </div>
      </Section>
    </div>
  );
}

function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="card-glass p-6">
      <div className="mb-4">
        <div className="font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      {children}
    </div>
  );
}

function Toggle({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
      <span>{label}</span>
      <input type="checkbox" defaultChecked={defaultChecked} className="h-4 w-4 accent-[var(--color-primary)]" />
    </label>
  );
}
