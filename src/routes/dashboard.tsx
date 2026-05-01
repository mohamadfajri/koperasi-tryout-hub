import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trophy, Clock, FileText, Receipt, FileQuestion, Timer, Sparkles, Crown, ArrowRight, PlayCircle, CheckCircle2 } from "lucide-react";
import { formatDate, formatRupiah } from "@/lib/format";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — CBT Koperasi" }] }),
  component: DashboardPage,
});

interface Sesi {
  id: string;
  paket_id: string;
  status: string;
  skor: number | null;
  jumlah_benar: number | null;
  waktu_mulai: string;
  waktu_selesai: string | null;
  paket_tryout: { judul: string; jumlah_soal: number; max_attempts?: number } | null;
  execution_enabled?: boolean;
}
interface Bayar {
  id: string;
  paket_id: string;
  status: "pending" | "approved" | "rejected";
  nominal: number;
  created_at: string;
  catatan_admin: string | null;
  paket_tryout: { judul: string } | null;
}

interface AppSettings {
  key: string;
  tryout_enabled: boolean;
}

interface Paket {
  id: string;
  judul: string;
  deskripsi: string | null;
  harga: number;
  durasi_menit: number;
  jumlah_soal: number;
  max_attempts: number;
  is_gratis: boolean;
}

interface BuktiRow {
  paket_id: string | null;
  status: "pending" | "approved" | "rejected";
}

function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sesi, setSesi] = useState<Sesi[]>([]);
  const [bayar, setBayar] = useState<Bayar[]>([]);
  const [paket, setPaket] = useState<Paket[]>([]);
  const [bukti, setBukti] = useState<BuktiRow[]>([]);
  const [profileName, setProfileName] = useState<string>("");
  const [tryoutEnabled, setTryoutEnabled] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/auth", search: { mode: "login", redirect: "/dashboard" } });
      return;
    }
    void load();
  }, [authLoading, user]);

  const load = async () => {
    setLoading(true);
    const [{ data: prof }, { data: s }, { data: b }, { data: appSettings }, { data: pk }, { data: bg }] = await Promise.all([
      supabase.from("profiles").select("full_name").eq("id", user!.id).single(),
      supabase
        .from("sesi_tryout")
        .select("id, paket_id, status, skor, jumlah_benar, waktu_mulai, waktu_selesai, paket_tryout(judul, jumlah_soal, max_attempts)")
        .eq("user_id", user!.id)
        .order("waktu_mulai", { ascending: false }),
      supabase
        .from("pembayaran")
        .select("id, paket_id, status, nominal, created_at, catatan_admin, paket_tryout(judul)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("app_settings")
        .select("key, tryout_enabled")
        .eq("key", "global")
        .maybeSingle(),
      supabase
        .from("paket_tryout")
        .select("*")
        .eq("is_aktif", true)
        .order("is_gratis", { ascending: false })
        .order("harga", { ascending: true }),
      supabase
        .from("bukti_tryout_gratis")
        .select("paket_id, status")
        .eq("user_id", user!.id),
    ]);
    setProfileName(prof?.full_name ?? "");
    setSesi(
      ((s as Sesi[]) ?? []).map((item) => ({
        ...item,
        execution_enabled: ((item.paket_tryout as (Sesi["paket_tryout"] & { max_attempts?: number }) | null)?.max_attempts ?? 0) >= 0,
      })),
    );
    setBayar((b as Bayar[]) ?? []);
    setPaket((pk as Paket[]) ?? []);
    setBukti((bg as BuktiRow[]) ?? []);
    setTryoutEnabled((appSettings as AppSettings | null)?.tryout_enabled ?? true);
    setLoading(false);
  };

  if (loading || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  const completed = sesi.filter((x) => x.status === "completed");
  const inprogress = sesi.filter((x) => x.status === "in_progress");
  const avgScore =
    completed.length > 0
      ? Math.round(completed.reduce((sum, x) => sum + (x.skor ?? 0), 0) / completed.length)
      : 0;

  // Akses paket: gratis (bukti approved) atau berbayar (pembayaran approved)
  const approvedFreeIds = new Set(
    bukti.filter((x) => x.status === "approved" && x.paket_id).map((x) => x.paket_id as string),
  );
  const approvedPaidIds = new Set(
    bayar.filter((x) => x.status === "approved").map((x) => x.paket_id),
  );
  const myPaket = paket.filter(
    (p) => (p.is_gratis && approvedFreeIds.has(p.id)) || (!p.is_gratis && approvedPaidIds.has(p.id)),
  );
  const inProgressByPaket: Record<string, Sesi | undefined> = {};
  inprogress.forEach((s) => {
    if (!inProgressByPaket[s.paket_id]) inProgressByPaket[s.paket_id] = s;
  });
  const lastCompletedByPaket: Record<string, Sesi | undefined> = {};
  completed.forEach((s) => {
    if (!lastCompletedByPaket[s.paket_id]) lastCompletedByPaket[s.paket_id] = s;
  });
  const attemptsByPaket: Record<string, number> = {};
  sesi.forEach((s) => {
    if (s.status === "completed" || s.status === "abandoned") {
      attemptsByPaket[s.paket_id] = (attemptsByPaket[s.paket_id] ?? 0) + 1;
    }
  });

  // Upsell: user pernah selesai paket gratis tapi belum punya akses berbayar
  const hasCompletedFree = completed.some((s) =>
    paket.find((p) => p.id === s.paket_id)?.is_gratis,
  );
  const hasAnyPaid = approvedPaidIds.size > 0;
  const showUpsell = hasCompletedFree && !hasAnyPaid;
  const premiumPaket = paket.filter((p) => !p.is_gratis);

  const startTryout = async (paketId: string) => {
    if (!tryoutEnabled) return;
    setActionId(paketId);
    const target = paket.find((p) => p.id === paketId);
    const existing = inProgressByPaket[paketId];
    if (existing) {
      navigate({ to: "/tryout/$sesiId", params: { sesiId: existing.id } });
      return;
    }
    if (target && target.max_attempts > 0 && (attemptsByPaket[paketId] ?? 0) >= target.max_attempts) {
      setActionId(null);
      return;
    }
    const { data: newSesi, error } = await supabase
      .from("sesi_tryout")
      .insert({ user_id: user!.id, paket_id: paketId })
      .select("id")
      .single();
    setActionId(null);
    if (!error && newSesi) {
      navigate({ to: "/tryout/$sesiId", params: { sesiId: newSesi.id } });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto px-4 py-10 sm:px-6">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold">Halo, {profileName || user?.email}</h1>
          <p className="mt-1 text-muted-foreground">Pantau progress tryout dan pembayaranmu di sini.</p>
        </div>

        {!tryoutEnabled && (
          <div className="mb-6 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning-foreground">
            Tryout sedang dinonaktifkan admin. Sesi yang sedang berjalan juga tidak bisa dilanjutkan sementara.
          </div>
        )}

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <div className="rounded-lg bg-primary-soft p-3 text-primary">
                <Trophy className="size-6" />
              </div>
              <div>
                <div className="text-2xl font-bold">{completed.length}</div>
                <div className="text-xs text-muted-foreground">Tryout Selesai</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <div className="rounded-lg bg-accent/15 p-3 text-accent">
                <FileText className="size-6" />
              </div>
              <div>
                <div className="text-2xl font-bold">{avgScore}</div>
                <div className="text-xs text-muted-foreground">Rata-rata Skor</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <div className="rounded-lg bg-warning/20 p-3 text-warning-foreground">
                <Clock className="size-6" />
              </div>
              <div>
                <div className="text-2xl font-bold">{inprogress.length}</div>
                <div className="text-xs text-muted-foreground">Sesi Berjalan</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tryout Saya */}
        <div className="mb-8">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="font-serif text-xl font-bold sm:text-2xl">Tryout Saya</h2>
              <p className="text-sm text-muted-foreground">Paket yang sudah bisa kamu kerjakan.</p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/paket">
                Cari Paket Lain <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
          </div>

          {myPaket.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                <div className="rounded-full bg-primary-soft p-3 text-primary">
                  <Sparkles className="size-6" />
                </div>
                <div>
                  <div className="font-semibold">Belum punya tryout aktif</div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Mulai dari paket gratis dulu, atau langsung beli premium.
                  </p>
                </div>
                <Button asChild>
                  <Link to="/paket">Pilih Paket</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {myPaket.map((p) => {
                const inProg = inProgressByPaket[p.id];
                const lastDone = lastCompletedByPaket[p.id];
                const attempts = attemptsByPaket[p.id] ?? 0;
                const limitReached = p.max_attempts > 0 && attempts >= p.max_attempts;
                const executionDisabled = p.max_attempts < 0;
                return (
                  <Card key={p.id} className="overflow-hidden border-2 border-primary/20 shadow-sm transition hover:shadow-md">
                    <CardHeader className="pb-3 text-center">
                      <CardTitle className="font-serif text-base font-bold uppercase leading-tight sm:text-lg">
                        {p.judul}
                      </CardTitle>
                      <div className="mt-1 flex justify-center">
                        {p.is_gratis ? (
                          <Badge className="bg-accent text-accent-foreground">
                            <Sparkles className="mr-1 size-3" /> GRATIS
                          </Badge>
                        ) : (
                          <Badge className="bg-primary text-primary-foreground">
                            <Crown className="mr-1 size-3" /> PREMIUM
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2 rounded-lg bg-muted/40 p-3 text-sm">
                        <div className="flex items-center gap-2">
                          <FileQuestion className="size-4 text-primary" />
                          <span className="w-20 font-medium">Jumlah</span>
                          <span>:</span>
                          <span className="ml-auto sm:ml-2">{p.jumlah_soal} Soal</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Timer className="size-4 text-primary" />
                          <span className="w-20 font-medium">Durasi</span>
                          <span>:</span>
                          <span className="ml-auto sm:ml-2">{p.durasi_menit} Menit</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Trophy className="size-4 text-primary" />
                          <span className="w-20 font-medium">Skor</span>
                          <span>:</span>
                          <span className="ml-auto font-semibold sm:ml-2">
                            {lastDone?.skor != null ? lastDone.skor : "—"}
                          </span>
                        </div>
                      </div>

                      {limitReached ? (
                        <div className="rounded-md bg-muted px-3 py-2 text-xs italic text-muted-foreground">
                          Batas pengerjaan tercapai ({attempts}/{p.max_attempts}).
                        </div>
                      ) : (
                        <div className="rounded-md bg-primary-soft px-3 py-2 text-xs italic text-primary">
                          {inProg
                            ? "Ada sesi yang belum selesai — lanjutkan!"
                            : p.max_attempts > 0
                            ? `Sisa pengerjaan: ${p.max_attempts - attempts}× dari ${p.max_attempts}`
                            : "Bisa dikerjakan kapan saja."}
                        </div>
                      )}

                      <div className="flex flex-col gap-2">
                        <Button
                          className="w-full"
                          disabled={!tryoutEnabled || executionDisabled || limitReached || actionId === p.id}
                          onClick={() => startTryout(p.id)}
                        >
                          {actionId === p.id ? (
                            <Loader2 className="mr-2 size-4 animate-spin" />
                          ) : inProg ? (
                            <PlayCircle className="mr-2 size-4" />
                          ) : (
                            <CheckCircle2 className="mr-2 size-4" />
                          )}
                          {!tryoutEnabled
                            ? "Tryout Ditutup"
                            : executionDisabled
                            ? "Pengerjaan OFF"
                            : limitReached
                            ? "Selesai"
                            : inProg
                            ? "Lanjutkan"
                            : "Kerjakan Sekarang"}
                        </Button>
                        {lastDone && (
                          <Button asChild variant="outline" className="w-full">
                            <Link to="/hasil/$sesiId" params={{ sesiId: lastDone.id }}>
                              Lihat Hasil
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
        </div>

        {/* Upsell setelah selesai gratis */}
        {showUpsell && premiumPaket.length > 0 && (
          <Card className="mb-6 overflow-hidden border-primary/40 bg-gradient-to-br from-primary/10 via-accent/5 to-background">
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-primary p-2.5 text-primary-foreground">
                  <Crown className="size-5" />
                </div>
                <div>
                  <div className="font-serif text-lg font-bold">Sudah cobain yang gratis? Saatnya naik level! 🚀</div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Akses paket premium dengan soal lebih banyak, pembahasan lengkap, dan ranking eksklusif.
                  </p>
                </div>
              </div>
              <Button asChild size="lg" className="shrink-0">
                <Link to="/paket">
                  Lihat Premium <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Riwayat tryout */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Riwayat Tryout</CardTitle>
          </CardHeader>
          <CardContent>
            {completed.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Belum ada tryout yang diselesaikan.{" "}
                <Link to="/paket" className="text-primary hover:underline">
                  Mulai sekarang →
                </Link>
              </p>
            ) : (
              <div className="space-y-2">
                {completed.map((s) => (
                  <Link
                    key={s.id}
                    to="/hasil/$sesiId"
                    params={{ sesiId: s.id }}
                    className="flex items-center justify-between rounded-md border border-border bg-card p-3 transition-colors hover:border-primary/40 hover:bg-muted/40"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">{s.paket_tryout?.judul}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(s.waktu_selesai)} · {s.jumlah_benar}/{s.paket_tryout?.jumlah_soal} benar
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-serif text-2xl font-bold text-primary">{s.skor}</div>
                      <div className="text-xs text-muted-foreground">skor</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pembayaran */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Receipt className="size-4" /> Riwayat Pembayaran
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bayar.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Belum ada transaksi pembayaran.
              </p>
            ) : (
              <div className="space-y-2">
                {bayar.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between rounded-md border border-border bg-card p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">{b.paket_tryout?.judul}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(b.created_at)} · {formatRupiah(b.nominal)}
                      </div>
                      {b.catatan_admin && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          Catatan: {b.catatan_admin}
                        </div>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        b.status === "approved"
                          ? "border-success text-success"
                          : b.status === "rejected"
                          ? "border-destructive text-destructive"
                          : "border-warning text-warning-foreground"
                      }
                    >
                      {b.status === "approved" ? "Disetujui" : b.status === "rejected" ? "Ditolak" : "Menunggu"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
