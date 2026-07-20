import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogOut, User as UserIcon } from "lucide-react";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeProvider";
import { supabase } from "@/integrations/supabase/client";

const links = [
  { to: "/app", label: "Dashboard" },
  { to: "/app/send", label: "Send" },
  { to: "/app/compare", label: "Compare" },
  { to: "/app/transfers", label: "History" },
  { to: "/app/scheduled", label: "Scheduled" },
  { to: "/app/analytics", label: "Analytics" },
];

export function Navbar() {
  const { location } = useRouterState();
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container-page flex h-16 items-center gap-4">
        <Link to="/" className="flex items-center">
          <Logo size={28} />
        </Link>
        <nav className="hidden flex-1 gap-1 md:flex">
          {links.map((l) => {
            const active =
              l.to === "/app"
                ? location.pathname === "/app"
                : location.pathname.startsWith(l.to);
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-accent text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <div className="relative">
            <button
              onClick={() => setOpen((o) => !o)}
              className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase"
            >
              {email ? email[0] : <UserIcon size={16} />}
            </button>
            {open && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-popover p-2 shadow-lg">
                <div className="border-b border-border px-2 py-2 text-xs text-muted-foreground truncate">
                  {email ?? "Not signed in"}
                </div>
                <Link to="/app/profile" onClick={() => setOpen(false)} className="block rounded-md px-2 py-2 text-sm hover:bg-accent">Profile</Link>
                <Link to="/app/settings" onClick={() => setOpen(false)} className="block rounded-md px-2 py-2 text-sm hover:bg-accent">Settings</Link>
                <button onClick={signOut} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-destructive hover:bg-accent">
                  <LogOut size={14} /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
