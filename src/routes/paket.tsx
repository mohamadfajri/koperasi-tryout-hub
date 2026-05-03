import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpenCheck, CheckCircle2, Clock, FileQuestion, GraduationCap, Loader2, Lock, Sparkles, Trophy } from "lucide-react";
import { toast } from "sonner";
import { formatRupiah } from "@/lib/format";
import { FreeTryoutRequirementsDialog } from "@/components/free-tryout-requirements-dialog";

export const Route = createFileRoute("/paket")({
  head: () => ({ meta: [{ title: "Paket Tryout — CBT Koperasi" }] }),
  component: PaketPage,
});

interface Paket {
  id: string;
  judul: string;
  deskripsi: string | null;
  harga: number;
  durasi_menit: number;
  jumlah_soal: number;
  max_attempts: number;
  is_gratis: boolean;
  execution_enabled?: boolean;
}

interface PembayaranAccess {
  paket_id: string;
  status: "pending" | "approved" | "rejected";
}

interface BuktiGratisRow {
  paket_id: string | null;
  status: "pending" | "approved" | "rejected";
}

interface AppSettings {
  key: string;
  tryout_enabled: boolean;
}

function PaketPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [paket, setPaket] = useState<Paket[]>([]);
  const [access, setAccess] = useState<PembayaranAccess[]>([]);
  const [buktiGratis, setBuktiGratis] = useState<BuktiGratisRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [tryoutEnabled, setTryoutEnabled] = useState(true);
  const [reqDialogOpen, setReqDialogOpen] = useState(false);
  const [pendingPaketId, setPendingPaketId] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, [user]);

  const load = async () => {
    setLoading(true);
    const [{ data: pk }, { data: appSettings }] = await Promise.all([
      supabase
        .from("paket_tryout")
        .select("*")
        .eq("is_aktif", true)
        .order("is_gratis", { ascending: false })
        .order("harga", { ascending: true }),
      supabase
        .from("app_settings")
        .select("key, tryout_enabled")
        .eq("key", "global")
        .maybeSingle(),
    ]);
    setPaket(
      ((pk as Paket[]) ?? []).map((item) => ({
        ...item,
        execution_enabled: item.max_attempts >= 0,
      })),
    );
    setTryoutEnabled((appSettings as AppSettings | null)?.tryout_enabled ?? true);
    if (user) {
      const [{ data: pay }, { data: bg }] = await Promise.all([
        supabase.from("pembayaran").select("paket_id, status").eq("user_id", user.id),
        supabase.from("bukti_tryout_gratis").select("paket_id, status").eq("user_id", user.id),
      ]);
      setAccess((pay as PembayaranAccess[]) ?? []);
      setBuktiGratis((bg as BuktiGratisRow[]) ?? []);
    }
    setLoading(false);
  };

  const buktiStatusFor = (paketId: string): "approved" | "pending" | "rejected" | "none" => {
    const rows = buktiGratis.filter((b) => b.paket_id === paketId);
    if (rows.some((r) => r.status === "approved")) return "approved";
    if (rows.some((r) => r.status === "pending")) return "pending";
    if (rows.some((r) => r.status === "rejected")) return "rejected";
    return "none";
  };

  const accessFor = (paketId: string, isGratis: boolean) => {
    if (isGratis) {
      const s = buktiStatusFor(paketId);
      if (s === "approved") return "free" as const;
      if (s === "pending") return "free_pending" as const;
      return "free_locked" as const;
    }
    const found = access.find((a) => a.paket_id === paketId);
    if (found?.status === "approved") return "paid" as const;
    if (found?.status === "pending") return "pending" as const;
    return "locked" as const;
  };

  const startTryout = async (paketId: string) => {
    if (!user) {
      navigate({ to: "/auth", search: { mode: "login", redirect: "/paket" } });
      return;
    }
    if (!tryoutEnabled) {
      toast.error("Tryout sedang dinonaktifkan admin untuk sementara.");
      return;
    }
    const target = paket.find((p) => p.id === paketId);
    if (!target?.execution_enabled) {
      toast.error("Pengerjaan tryout untuk paket ini sedang ditutup admin.");
      return;
    }
    // Untuk paket GRATIS: wajib upload bukti & disetujui admin dulu
    if (target?.is_gratis) {
      const status = buktiStatusFor(paketId);
      if (status === "approved") {
        // lanjut start
      } else if (status === "pending") {
        toast.info("Bukti kamu sedang menunggu verifikasi admin. Coba lagi setelah disetujui.");
        return;
      } else {
        // belum kirim atau ditolak → buka dialog
        setPendingPaketId(paketId);
        setReqDialogOpen(true);
        return;
      }
    }
    setActionId(paketId);
    // cek sesi in_progress
    const { data: existing } = await supabase
      .from("sesi_tryout")
      .select("id")
      .eq("user_id", user.id)
      .eq("paket_id", paketId)
      .eq("status", "in_progress")
      .maybeSingle();
    if (existing) {
      navigate({ to: "/tryout/$sesiId", params: { sesiId: existing.id } });
      return;
    }
    // Cek batas pengerjaan
    if (target && target.max_attempts > 0) {
      const { count } = await supabase
        .from("sesi_tryout")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("paket_id", paketId)
        .in("status", ["completed", "abandoned"]);
      if ((count ?? 0) >= target.max_attempts) {
        setActionId(null);
        toast.error(`Batas pengerjaan tercapai (maks ${target.max_attempts}× untuk paket ini).`);
        return;
      }
    }
    const { data: sesi, error } = await supabase
      .from("sesi_tryout")
      .insert({ user_id: user.id, paket_id: paketId })
      .select("id")
      .single();
    setActionId(null);
    if (error || !sesi) {
      toast.error("Gagal memulai tryout: " + (error?.message ?? "unknown"));
      return;
    }
    navigate({ to: "/tryout/$sesiId", params: { sesiId: sesi.id } });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto px-4 py-12 sm:px-6">
        <div className="mb-10 text-center">
          <h1 className="font-serif text-3xl font-bold sm:text-4xl">Paket Tryout Tersedia</h1>
          <p className="mt-3 text-muted-foreground">
            Pilih paket sesuai kebutuhanmu. Mulai dari yang gratis dulu kalau baru pertama kali.
          </p>
        </div>

        {!tryoutEnabled && (
          <div className="mb-6 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning-foreground">
            Tryout sedang ditutup sementara oleh admin. Anda masih bisa melihat paket, tetapi belum bisa memulai pengerjaan.
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : paket.length === 0 ? (
          <p className="text-center text-muted-foreground">Belum ada paket tryout tersedia.</p>
        ) : (
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
            {paket.map((p) => {
              const acc = accessFor(p.id, p.is_gratis);
              const executionEnabled = p.execution_enabled ?? true;
              return (
                <Card
                  key={p.id}
                  className={`group relative flex flex-col overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl ${
                    p.is_gratis ? "border-accent/40" : "border-primary/30"
                  }`}
                >
                  {/* Visual header / cover */}
                  <div
                    className={`relative h-32 w-full overflow-hidden ${
                      p.is_gratis ? "bg-gradient-to-br from-accent/25 via-accent/10 to-background" : "bg-gradient-to-br from-primary/20 via-primary-soft to-background"
                    }`}
                  >
                    <div className="absolute inset-0 opacity-[0.07]" style={{
                      backgroundImage: "radial-gradient(circle at 20% 20%, currentColor 1px, transparent 1px), radial-gradient(circle at 80% 60%, currentColor 1px, transparent 1px)",
                      backgroundSize: "24px 24px",
                    }} />
                    <div className="absolute left-5 top-5">
                      <div className={`flex size-14 items-center justify-center rounded-2xl shadow-md ring-1 ring-border/50 ${
                        p.is_gratis ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"
                      }`}>
                        {p.is_gratis ? <GraduationCap className="size-7" /> : <Trophy className="size-7" />}
                      </div>
                    </div>
                    <div className="absolute right-4 top-4 flex flex-wrap justify-end gap-2">
                      {p.is_gratis ? (
                        <Badge className="bg-accent text-accent-foreground shadow">
                          <Sparkles className="mr-1 size-3" /> GRATIS
                        </Badge>
                      ) : (
                        <Badge className="bg-primary text-primary-foreground shadow">
                          <BookOpenCheck className="mr-1 size-3" /> PREMIUM
                        </Badge>
                      )}
                      {!executionEnabled && (
                        <Badge variant="secondary">Pengerjaan Ditutup</Badge>
                      )}
                    </div>
                  </div>

                  <CardHeader className="pb-3">
                    <CardTitle className="font-serif text-xl leading-snug">{p.judul}</CardTitle>
                    {p.deskripsi && (
                      <CardDescription className="mt-1.5 line-clamp-2">{p.deskripsi}</CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="flex flex-1 flex-col gap-4">
                    {/* Info pills */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
                        <FileQuestion className="size-4 text-primary" />
                        <div>
                          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Soal</div>
                          <div className="font-semibold leading-tight">{p.jumlah_soal}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
                        <Clock className="size-4 text-primary" />
                        <div>
                          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Durasi</div>
                          <div className="font-semibold leading-tight">{p.durasi_menit} mnt</div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto flex items-end justify-between gap-3 border-t border-border pt-4">
                      <div>
                        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Harga</div>
                        {p.is_gratis ? (
                          <div className="text-2xl font-bold text-accent">Rp 0</div>
                        ) : (
                          <div className="text-2xl font-bold text-primary">{formatRupiah(p.harga)}</div>
                        )}
                      </div>

                      {acc === "free" || acc === "paid" ? (
                        <Button onClick={() => startTryout(p.id)} disabled={actionId === p.id || !tryoutEnabled || !executionEnabled}>
                          {actionId === p.id ? (
                            <Loader2 className="mr-2 size-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="mr-2 size-4" />
                          )}
                          {!tryoutEnabled ? "Tryout Ditutup" : !executionEnabled ? "Pengerjaan OFF" : "Mulai Tryout"}
                        </Button>
                      ) : acc === "free_pending" ? (
                        <Button variant="outline" disabled>
                          <Clock className="mr-2 size-4" /> Menunggu ACC Admin
                        </Button>
                      ) : acc === "free_locked" ? (
                        <Button onClick={() => startTryout(p.id)}>
                          <Sparkles className="mr-2 size-4" /> Ikut Gratis
                        </Button>
                      ) : acc === "pending" ? (
                        <Button variant="outline" disabled>
                          <Clock className="mr-2 size-4" /> Menunggu Verifikasi
                        </Button>
                      ) : (
                        <Button asChild>
                          <Link to="/bayar/$paketId" params={{ paketId: p.id }}>
                            <Lock className="mr-2 size-4" />
                            Beli Akses
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      <SiteFooter />
      <FreeTryoutRequirementsDialog
        open={reqDialogOpen}
        onOpenChange={setReqDialogOpen}
        paketJudul={paket.find((p) => p.id === pendingPaketId)?.judul}
        paketId={pendingPaketId ?? undefined}
        onConfirmed={() => {
          setReqDialogOpen(false);
          setPendingPaketId(null);
          void load();
        }}
      />
    </div>
  );
}
