import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trophy, Clock, FileText, Receipt } from "lucide-react";
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
  paket_tryout: { judul: string; jumlah_soal: number } | null;
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

function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sesi, setSesi] = useState<Sesi[]>([]);
  const [bayar, setBayar] = useState<Bayar[]>([]);
  const [profileName, setProfileName] = useState<string>("");

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
    const [{ data: prof }, { data: s }, { data: b }] = await Promise.all([
      supabase.from("profiles").select("full_name").eq("id", user!.id).single(),
      supabase
        .from("sesi_tryout")
        .select("id, paket_id, status, skor, jumlah_benar, waktu_mulai, waktu_selesai, paket_tryout(judul, jumlah_soal)")
        .eq("user_id", user!.id)
        .order("waktu_mulai", { ascending: false }),
      supabase
        .from("pembayaran")
        .select("id, paket_id, status, nominal, created_at, catatan_admin, paket_tryout(judul)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false }),
    ]);
    setProfileName(prof?.full_name ?? "");
    setSesi((s as Sesi[]) ?? []);
    setBayar((b as Bayar[]) ?? []);
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

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto px-4 py-10 sm:px-6">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold">Halo, {profileName || user?.email}</h1>
          <p className="mt-1 text-muted-foreground">Pantau progress tryout dan pembayaranmu di sini.</p>
        </div>

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

        {/* Sesi in progress */}
        {inprogress.length > 0 && (
          <Card className="mb-6 border-warning/40 bg-warning/5">
            <CardHeader>
              <CardTitle className="text-base">Lanjutkan Tryout</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {inprogress.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-md bg-card p-3">
                  <div>
                    <div className="font-semibold">{s.paket_tryout?.judul}</div>
                    <div className="text-xs text-muted-foreground">
                      Mulai {formatDate(s.waktu_mulai)}
                    </div>
                  </div>
                  <Button asChild size="sm">
                    <Link to="/tryout/$sesiId" params={{ sesiId: s.id }}>Lanjutkan</Link>
                  </Button>
                </div>
              ))}
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
