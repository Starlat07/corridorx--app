import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { COUNTRIES } from "@/lib/corridorx";

export const Route = createFileRoute("/app/profile")({
  component: Profile,
  head: () => ({ meta: [{ title: "Profile — CorridorX" }] }),
});

function Profile() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      setEmail(u.user?.email ?? "");
      if (u.user) {
        const { data } = await supabase.from("profiles").select("full_name, country").eq("id", u.user.id).maybeSingle();
        setFullName(data?.full_name ?? "");
        setCountry(data?.country ?? "");
      }
      setLoading(false);
    })();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setSaving(false); return; }
    const { error } = await supabase.from("profiles").upsert({
      id: u.user.id,
      full_name: fullName,
      country,
      email,
    });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile updated");
  }

  if (loading) return <div className="text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your CorridorX identity.</p>
      </div>
      <form onSubmit={save} className="card-glass space-y-4 p-6">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Full name</span>
          <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Email</span>
          <input className="input" value={email} disabled />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Country</span>
          <select className="input" value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="">Select…</option>
            {COUNTRIES.map((c) => <option key={c.code} value={c.name}>{c.flag} {c.name}</option>)}
          </select>
        </label>
        <button className="btn-primary" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
      </form>
      <style>{`.input{width:100%;padding:.65rem .85rem;border-radius:.6rem;background:var(--color-input);border:1px solid var(--color-border);color:var(--color-foreground);font-size:.9rem;}.input:focus{border-color:var(--color-primary);outline:none;}.input:disabled{opacity:.6;}`}</style>
    </div>
  );
}
