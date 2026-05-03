import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Trophy, CheckCircle2, XCircle, MinusCircle, Sparkles, ArrowRight } from "lucide-react";
import { formatRupiah } from "@/lib/format";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/hasil/$sesiId")({
  head: () => ({ meta: [{ title: "Hasil Tryout — CBT Koperasi" }] }),
  component: HasilPage,
});

interface SesiDetail {
  id: string;
  paket_id: string;
  waktu_mulai: string;
  waktu_selesai: string | null;
  skor: number | null;
  jumlah_benar: number | null;
  jumlah_salah: number | null;
  status: string;
  paket_tryout: { judul: string; jumlah_soal: number; is_gratis: boolean } | null;
}

interface JawabanDetail {
  soal_id: string;
  jawaban: string | null;
  is_benar: boolean | null;
  soal: {
    nomor: number;
    pertanyaan: string;
    opsi_a: string;
    opsi_b: string;
    opsi_c: string;
    opsi_d: string;
    opsi_e: string | null;
    jawaban_benar: string;
    pembahasan: string | null;
    pertanyaan_gambar: string | null;
    opsi_a_gambar: string | null;
    opsi_b_gambar: string | null;
    opsi_c_gambar: string | null;
    opsi_d_gambar: string | null;
    opsi_e_gambar: string | null;
    pembahasan_gambar: string | null;
  } | null;
}

function HasilPage() {
  const { sesiId } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [sesi, setSesi] = useState<SesiDetail | null>(null);
  const [jawaban, setJawaban] = useState<JawabanDetail[]>([]);
  const [premiumPakets, setPremiumPakets] = useState<Array<{ id: string; judul: string; harga: number; jumlah_soal: number; durasi_menit: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/auth", search: { mode: "login", redirect: `/hasil/${sesiId}` } });
      return;
    }
    void load();
  }, [authLoading, user, sesiId]);

  const load = async () => {
    setLoading(true);
    const { data: s } = await supabase
      .from("sesi_tryout")
      .select("*, paket_tryout(judul, jumlah_soal, is_gratis)")
      .eq("id", sesiId)
      .single();
    setSesi(s as SesiDetail);

    const sesiData = s as SesiDetail | null;

    // Ambil SEMUA soal pada paket ini (bukan hanya yang dijawab user)
    const { data: allSoal } = await supabase
      .from("soal")
      .select("id, nomor, pertanyaan, opsi_a, opsi_b, opsi_c, opsi_d, opsi_e, jawaban_benar, pembahasan, pertanyaan_gambar, opsi_a_gambar, opsi_b_gambar, opsi_c_gambar, opsi_d_gambar, opsi_e_gambar, pembahasan_gambar")
      .eq("paket_id", sesiData?.paket_id ?? "")
      .order("nomor", { ascending: true });

    const { data: jw } = await supabase
      .from("jawaban_user")
      .select("soal_id, jawaban, is_benar")
      .eq("sesi_id", sesiId);

    const jwMap = new Map<string, { jawaban: string | null; is_benar: boolean | null }>();
    (jw as any[] ?? []).forEach((j) => {
      jwMap.set(j.soal_id, { jawaban: j.jawaban, is_benar: j.is_benar });
    });

    const merged: JawabanDetail[] = (allSoal as any[] ?? []).map((soal) => {
      const ans = jwMap.get(soal.id);
      return {
        soal_id: soal.id,
        jawaban: ans?.jawaban ?? null,
        is_benar: ans?.is_benar ?? null,
        soal: {
          nomor: soal.nomor,
          pertanyaan: soal.pertanyaan,
          opsi_a: soal.opsi_a,
          opsi_b: soal.opsi_b,
          opsi_c: soal.opsi_c,
          opsi_d: soal.opsi_d,
          opsi_e: soal.opsi_e,
          jawaban_benar: soal.jawaban_benar,
          pembahasan: soal.pembahasan,
          pertanyaan_gambar: soal.pertanyaan_gambar,
          opsi_a_gambar: soal.opsi_a_gambar,
          opsi_b_gambar: soal.opsi_b_gambar,
          opsi_c_gambar: soal.opsi_c_gambar,
          opsi_d_gambar: soal.opsi_d_gambar,
          opsi_e_gambar: soal.opsi_e_gambar,
          pembahasan_gambar: soal.pembahasan_gambar,
        },
      };
    });

    setJawaban(merged);

    // Jika paket gratis & sesi selesai, ambil paket premium untuk upsell
    if ((sesiData as any)?.paket_tryout?.is_gratis && sesiData?.status === "selesai") {
      const { data: premium } = await supabase
        .from("paket_tryout")
        .select("id, judul, harga, jumlah_soal, durasi_menit")
        .eq("is_aktif", true)
        .eq("is_gratis", false)
        .order("harga", { ascending: true })
        .limit(3);
      setPremiumPakets((premium as any[]) ?? []);
    }

    setLoading(false);
  };

  if (loading || authLoading || !sesi) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  const total = sesi.paket_tryout?.jumlah_soal ?? jawaban.length;
  const benar = sesi.jumlah_benar ?? 0;
  const salah = sesi.jumlah_salah ?? 0;
  const kosong = total - benar - salah;
  const skor = sesi.skor ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto px-4 py-10 sm:px-6">
        {/* Skor */}
        <Card className="mb-8 overflow-hidden">
          <div className="bg-gradient-hero p-8 text-center">
            <Trophy className="mx-auto mb-3 size-12 text-primary" />
            <h1 className="font-serif text-2xl font-bold sm:text-3xl">{sesi.paket_tryout?.judul}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Selesai pada {formatDate(sesi.waktu_selesai)}
            </p>
            <div className="mt-6">
              <div className="font-serif text-6xl font-bold text-primary sm:text-7xl">{skor}</div>
              <div className="text-sm text-muted-foreground">dari skor 100</div>
            </div>
          </div>
          <CardContent className="grid grid-cols-3 gap-4 p-6">
            <div className="rounded-lg bg-success/10 p-4 text-center">
              <CheckCircle2 className="mx-auto mb-1 size-5 text-success" />
              <div className="text-2xl font-bold text-success">{benar}</div>
              <div className="text-xs text-muted-foreground">Benar</div>
            </div>
            <div className="rounded-lg bg-destructive/10 p-4 text-center">
              <XCircle className="mx-auto mb-1 size-5 text-destructive" />
              <div className="text-2xl font-bold text-destructive">{salah}</div>
              <div className="text-xs text-muted-foreground">Salah</div>
            </div>
            <div className="rounded-lg bg-muted p-4 text-center">
              <MinusCircle className="mx-auto mb-1 size-5 text-muted-foreground" />
              <div className="text-2xl font-bold text-muted-foreground">{kosong}</div>
              <div className="text-xs text-muted-foreground">Kosong</div>
            </div>
          </CardContent>
        </Card>

        {/* Upsell premium setelah tryout gratis */}
        {sesi.paket_tryout?.is_gratis && premiumPakets.length > 0 && (
          <Card className="mb-8 overflow-hidden border-primary/30 bg-gradient-to-br from-primary/5 via-card to-accent/5">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    <Sparkles className="size-3.5" />
                    Selamat! Tryout gratis selesai
                  </div>
                  <h2 className="font-serif text-xl font-bold sm:text-2xl">
                    Lanjutkan ke Tryout Premium
                  </h2>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    Materi FR CAT terbaru, soal lebih lengkap, dan prediksi terakurat untuk persiapan
                    seleksi Kopdes Merah Putih.
                  </p>
                </div>
                <Button asChild size="lg" className="shrink-0 gap-2">
                  <Link to="/paket">
                    Lihat Paket Premium <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {premiumPakets.map((p) => (
                  <Link
                    key={p.id}
                    to="/bayar/$paketId"
                    params={{ paketId: p.id }}
                    className="group flex flex-col rounded-xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                  >
                    <div className="line-clamp-2 font-semibold leading-tight">{p.judul}</div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{p.jumlah_soal} soal</span>
                      <span>•</span>
                      <span>{p.durasi_menit} mnt</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-lg font-bold text-primary">{formatRupiah(p.harga)}</div>
                      <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pembahasan */}
        <h2 className="mb-4 font-serif text-xl font-bold">Pembahasan</h2>
        <div className="space-y-4">
          {jawaban.map((j) => {
            if (!j.soal) return null;
            const benar = j.is_benar;
            const opts: Array<{ k: "A" | "B" | "C" | "D" | "E"; t: string | null; img: string | null }> = [
              { k: "A", t: j.soal.opsi_a, img: j.soal.opsi_a_gambar },
              { k: "B", t: j.soal.opsi_b, img: j.soal.opsi_b_gambar },
              { k: "C", t: j.soal.opsi_c, img: j.soal.opsi_c_gambar },
              { k: "D", t: j.soal.opsi_d, img: j.soal.opsi_d_gambar },
              { k: "E", t: j.soal.opsi_e, img: j.soal.opsi_e_gambar },
            ];
            return (
              <Card key={j.soal_id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-base font-semibold">
                      Soal {j.soal.nomor}
                    </CardTitle>
                    {benar === true ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
                        <CheckCircle2 className="size-3" /> Benar
                      </span>
                    ) : j.jawaban ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-medium text-destructive">
                        <XCircle className="size-3" /> Salah
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        Tidak dijawab
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="whitespace-pre-wrap text-sm">{j.soal.pertanyaan}</p>
                  {j.soal.pertanyaan_gambar && (
                    <img src={j.soal.pertanyaan_gambar} alt="Gambar soal" className="max-h-80 rounded border border-border" />
                  )}
                  <div className="space-y-1.5">
                    {opts.map((o) =>
                      o.t || o.img ? (
                        <div
                          key={o.k}
                          className={`flex items-start gap-2 rounded-md border p-2 text-sm ${
                            o.k === j.soal!.jawaban_benar
                              ? "border-success/40 bg-success/5"
                              : o.k === j.jawaban
                              ? "border-destructive/40 bg-destructive/5"
                              : "border-border"
                          }`}
                        >
                          <span className="font-bold">{o.k}.</span>
                          <div className="flex-1 space-y-1">
                            {o.t && <div>{o.t}</div>}
                            {o.img && <img src={o.img} alt={`Opsi ${o.k}`} className="max-h-40 rounded border border-border" />}
                          </div>
                          {o.k === j.soal!.jawaban_benar && (
                            <span className="text-xs font-semibold text-success">✓ Jawaban benar</span>
                          )}
                          {o.k === j.jawaban && o.k !== j.soal!.jawaban_benar && (
                            <span className="text-xs font-semibold text-destructive">Jawabanmu</span>
                          )}
                        </div>
                      ) : null
                    )}
                  </div>
                  {(j.soal.pembahasan || j.soal.pembahasan_gambar) && (
                    <div className="rounded-md bg-primary-soft p-3 text-sm">
                      <div className="mb-1 text-xs font-bold uppercase text-primary">Pembahasan</div>
                      {j.soal.pembahasan && <p className="whitespace-pre-wrap">{j.soal.pembahasan}</p>}
                      {j.soal.pembahasan_gambar && (
                        <img src={j.soal.pembahasan_gambar} alt="Gambar pembahasan" className="mt-2 max-h-80 rounded border border-border" />
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 flex justify-center gap-3">
          <Button asChild variant="outline">
            <Link to="/dashboard">Ke Dashboard</Link>
          </Button>
          <Button asChild>
            <Link to="/paket">Coba Paket Lain</Link>
          </Button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
