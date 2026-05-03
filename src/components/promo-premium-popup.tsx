import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "promo-premium-dismissed-at";
const SHOW_AFTER_MS = 4000; // tampilkan setelah 4 detik
const SNOOZE_MS = 1000 * 60 * 60 * 12; // tampil lagi setelah 12 jam

export function PromoPremiumPopup() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      if (dismissed && Date.now() - Number(dismissed) < SNOOZE_MS) return;
    } catch {
      // ignore
    }
    const t = setTimeout(() => setOpen(true), SHOW_AFTER_MS);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      // ignore
    }
  };

  if (!open) return null;

  // Versi minimized (chip kecil) supaya tidak mengganggu
  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
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
        // Mobile: di atas bottom-nav, full-width dengan margin
        "bottom-20 left-3 right-3",
        // Desktop: pojok kanan bawah, lebar tetap
        "md:bottom-6 md:right-6 md:left-auto md:w-[380px]",
      )}
    >
      <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-card shadow-2xl">
        {/* Tombol close */}
        <button
          onClick={dismiss}
          aria-label="Tutup promo"
          className="absolute right-2 top-2 z-10 rounded-full bg-background/80 p-1.5 text-foreground/70 backdrop-blur transition hover:bg-background hover:text-foreground"
        >
          <X className="size-4" />
        </button>
        {/* Tombol minimize */}
        <button
          onClick={() => setMinimized(true)}
          aria-label="Kecilkan promo"
          className="absolute right-10 top-2 z-10 rounded-full bg-background/80 px-2 py-0.5 text-[11px] font-medium text-foreground/70 backdrop-blur transition hover:bg-background hover:text-foreground"
        >
          –
        </button>

        <Link to="/paket" className="block" onClick={() => setOpen(false)}>
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
