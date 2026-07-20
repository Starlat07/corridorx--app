import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Send,
  Scale,
  History,
  CalendarClock,
  BarChart3,
  Settings,
  User as UserIcon,
  BookOpen,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeProvider";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/send", label: "Send Money", icon: Send },
  { to: "/app/compare", label: "Compare Routes", icon: Scale },
  { to: "/app/transfers", label: "Transfer History", icon: History },
  { to: "/app/scheduled", label: "Scheduled", icon: CalendarClock },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3 },
];

const SECONDARY = [
  { to: "/app/settings", label: "Settings", icon: Settings },
  { to: "/app/profile", label: "Profile", icon: UserIcon },
  { to: "/docs", label: "Docs", icon: BookOpen },
];

export function AppShellHeader({ onOpen }: { onOpen: () => void }) {
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 md:px-6">
        <button
          onClick={onOpen}
          className="grid h-9 w-9 place-items-center rounded-lg border border-border hover:bg-accent"
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>
        <Link to="/" className="flex items-center gap-2">
          <Logo size={26} />
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <div className="hidden text-xs text-muted-foreground sm:block truncate max-w-[180px]">
            {email}
          </div>
        </div>
      </div>
    </header>
  );
}

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { location } = useRouterState();
  const navigate = useNavigate();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function signOut() {
    await supabase.auth.signOut();
    onClose();
    navigate({ to: "/login" });
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-background transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <Link to="/" onClick={onClose} className="flex items-center gap-2">
            <Logo size={26} />
          </Link>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg hover:bg-accent"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          <div className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Workspace
          </div>
          {NAV.map((item) => {
            const active = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                  active
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-foreground/80 hover:bg-accent hover:text-foreground"
                }`}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}

          <div className="px-2 pb-1 pt-5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Account
          </div>
          {SECONDARY.map((item) => {
            const Icon = item.icon;
            const active = location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                  active
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-foreground/80 hover:bg-accent hover:text-foreground"
                }`}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-3">
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-accent"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
