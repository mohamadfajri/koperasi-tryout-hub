import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Trophy, CheckCircle2, XCircle, MinusCircle } from "lucide-react";
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
  paket_tryout: { judul: string; jumlah_soal: number } | null;
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
      .select("*, paket_tryout(judul, jumlah_soal)")
      .eq("id", sesiId)
      .single();
    setSesi(s as SesiDetail);

    const { data: jw } = await supabase
      .from("jawaban_user")
      .select("soal_id, jawaban, is_benar, soal:soal_id(nomor, pertanyaan, opsi_a, opsi_b, opsi_c, opsi_d, opsi_e, jawaban_benar, pembahasan)")
      .eq("sesi_id", sesiId);
    const sorted = (jw as any[])?.sort((a, b) => (a.soal?.nomor ?? 0) - (b.soal?.nomor ?? 0)) ?? [];
    setJawaban(sorted as JawabanDetail[]);
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

        {/* Pembahasan */}
        <h2 className="mb-4 font-serif text-xl font-bold">Pembahasan</h2>
        <div className="space-y-4">
          {jawaban.map((j) => {
            if (!j.soal) return null;
            const benar = j.is_benar;
            const opts: Array<{ k: "A" | "B" | "C" | "D" | "E"; t: string | null }> = [
              { k: "A", t: j.soal.opsi_a },
              { k: "B", t: j.soal.opsi_b },
              { k: "C", t: j.soal.opsi_c },
              { k: "D", t: j.soal.opsi_d },
              { k: "E", t: j.soal.opsi_e },
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
                  <div className="space-y-1.5">
                    {opts.map((o) =>
                      o.t ? (
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
                          <span className="flex-1">{o.t}</span>
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
                  {j.soal.pembahasan && (
                    <div className="rounded-md bg-primary-soft p-3 text-sm">
                      <div className="mb-1 text-xs font-bold uppercase text-primary">Pembahasan</div>
                      <p>{j.soal.pembahasan}</p>
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
