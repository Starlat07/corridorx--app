import { Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { X } from "lucide-react";

export function ConnectModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-popover p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-accent"
          aria-label="Close"
        >
          <X size={16} />
        </button>
        <h2 className="text-xl font-semibold">Connect to CorridorX</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to your account or create a new one to start routing transfers.
        </p>
        <div className="mt-6 grid gap-3">
          <Link to="/login" onClick={onClose} className="btn-primary w-full text-center">
            Sign in to existing account
          </Link>
          <Link to="/signup" onClick={onClose} className="btn-ghost w-full text-center">
            Create a new account
          </Link>
        </div>
        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          By continuing you agree to CorridorX's terms of service.
        </p>
      </div>
    </div>
  );
}
