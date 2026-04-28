import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, FileQuestion, Loader2, Lock, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { formatRupiah } from "@/lib/format";

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

interface AppSettings {
  key: string;
  tryout_enabled: boolean;
}

const paketExecutionKey = (paketId: string) => `paket_execution:${paketId}`;

function PaketPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [paket, setPaket] = useState<Paket[]>([]);
  const [access, setAccess] = useState<PembayaranAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [tryoutEnabled, setTryoutEnabled] = useState(true);

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
    const { data: perPaketSettings } = await supabase
      .from("app_settings")
      .select("key, tryout_enabled");
    const settingsMap = new Map((perPaketSettings ?? []).map((item) => [item.key, item.tryout_enabled]));
    setPaket(
      ((pk as Paket[]) ?? []).map((item) => ({
        ...item,
        execution_enabled: settingsMap.get(paketExecutionKey(item.id)) ?? true,
      })),
    );
    setTryoutEnabled((appSettings as AppSettings | null)?.tryout_enabled ?? true);
    if (user) {
      const { data: pay } = await supabase
        .from("pembayaran")
        .select("paket_id, status")
        .eq("user_id", user.id);
      setAccess((pay as PembayaranAccess[]) ?? []);
    }
    setLoading(false);
  };

  const accessFor = (paketId: string, isGratis: boolean) => {
    if (isGratis) return "free" as const;
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
                  className={p.is_gratis ? "border-accent/40" : "border-primary/30"}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="font-serif text-xl">{p.judul}</CardTitle>
                        <CardDescription className="mt-1">{p.deskripsi}</CardDescription>
                      </div>
                      <div className="flex flex-wrap justify-end gap-2">
                        {p.is_gratis ? (
                          <Badge className="bg-accent text-accent-foreground">
                            <Sparkles className="mr-1 size-3" /> GRATIS
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-primary text-primary">
                            PREMIUM
                          </Badge>
                        )}
                        {!executionEnabled && (
                          <Badge variant="secondary">Pengerjaan Ditutup</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <FileQuestion className="size-4" /> {p.jumlah_soal} soal
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="size-4" /> {p.durasi_menit} menit
                      </div>
                    </div>

                    <div className="flex items-end justify-between border-t border-border pt-4">
                      <div>
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
    </div>
  );
}
