import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const MINIMIZED_KEY = "promo-premium-minimized";
const SHOW_AFTER_MS = 2000;

export function PromoPremiumPopup() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(MINIMIZED_KEY) === "1") {
        setMinimized(true);
      }
    } catch {
      // ignore
    }
    const t = setTimeout(() => setOpen(true), SHOW_AFTER_MS);
    return () => clearTimeout(t);
  }, []);

  const minimize = () => {
    setMinimized(true);
    try {
      localStorage.setItem(MINIMIZED_KEY, "1");
    } catch {
      // ignore
    }
  };

  const expand = () => {
    setMinimized(false);
    try {
      localStorage.removeItem(MINIMIZED_KEY);
    } catch {
      // ignore
    }
  };

  if (!open) return null;

  // Versi minimized (chip kecil) — satu-satunya cara menyembunyikan banner
  if (minimized) {
    return (
      <button
        onClick={expand}
        className={cn(
          "fixed z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg",
          "bottom-20 right-4 md:bottom-6 md:right-6",
          "animate-in fade-in slide-in-from-bottom-2",
        )}
        aria-label="Lihat promo Tryout Premium"
      >
        🔥 Promo 20K
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-label="Promo Tryout Premium"
      className={cn(
        "fixed z-40 animate-in fade-in slide-in-from-bottom-3 duration-300",
        "bottom-20 left-3 right-3",
        "md:bottom-6 md:right-6 md:left-auto md:w-[380px]",
      )}
    >
      <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-card shadow-2xl">
        {/* Tombol minimize (X) — banner tidak bisa ditutup permanen, hanya diminimize */}
        <button
          onClick={minimize}
          aria-label="Kecilkan promo"
          className="absolute right-2 top-2 z-10 rounded-full bg-background/80 p-1.5 text-foreground/70 backdrop-blur transition hover:bg-background hover:text-foreground"
        >
          <X className="size-4" />
        </button>

        <Link to="/paket" className="block">
          <img
            src="/promo-premium-banner.png"
            alt="Tryout Premium berbasis tes asli, hanya 20K"
            className="h-auto w-full object-cover"
            loading="lazy"
          />
          <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-primary to-primary/80 px-4 py-3 text-primary-foreground">
            <div className="min-w-0">
              <div className="text-sm font-bold leading-tight">Tryout Premium 20K</div>
              <div className="text-[11px] opacity-90">Materi FR CAT — terbatas 300 seat</div>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-background/15 px-3 py-1.5 text-xs font-semibold backdrop-blur">
              Ambil <ArrowRight className="size-3.5" />
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}
