import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/tryout/$sesiId")({
  head: () => ({ meta: [{ title: "Pengerjaan Tryout — CBT Koperasi" }] }),
  component: TryoutPage,
});

interface Soal {
  id: string;
  nomor: number;
  pertanyaan: string;
  opsi_a: string;
  opsi_b: string;
  opsi_c: string;
  opsi_d: string;
  opsi_e: string | null;
}

interface Sesi {
  id: string;
  user_id: string;
  paket_id: string;
  waktu_mulai: string;
  status: string;
}

interface Paket {
  id: string;
  judul: string;
  durasi_menit: number;
}

const OPTS: Array<"A" | "B" | "C" | "D" | "E"> = ["A", "B", "C", "D", "E"];

function TryoutPage() {
  const { sesiId } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sesi, setSesi] = useState<Sesi | null>(null);
  const [paket, setPaket] = useState<Paket | null>(null);
  const [soal, setSoal] = useState<Soal[]>([]);
  const [jawaban, setJawaban] = useState<Record<string, string>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [remaining, setRemaining] = useState<number>(0);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/auth", search: { mode: "login", redirect: `/tryout/${sesiId}` } });
      return;
    }
    void load();
  }, [authLoading, user, sesiId]);

  const load = async () => {
    setLoading(true);
    const { data: s, error: sErr } = await supabase
      .from("sesi_tryout")
      .select("*")
      .eq("id", sesiId)
      .single();
    if (sErr || !s) {
      toast.error("Sesi tidak ditemukan");
      navigate({ to: "/dashboard" });
      return;
    }
    if (s.status === "completed") {
      navigate({ to: "/hasil/$sesiId", params: { sesiId } });
      return;
    }
    setSesi(s as Sesi);

    const { data: pk } = await supabase
      .from("paket_tryout")
      .select("id, judul, durasi_menit")
      .eq("id", s.paket_id)
      .single();
    setPaket(pk);

    const { data: sl } = await supabase
      .from("soal")
      .select("id, nomor, pertanyaan, opsi_a, opsi_b, opsi_c, opsi_d, opsi_e")
      .eq("paket_id", s.paket_id)
      .order("nomor", { ascending: true });
    setSoal(sl ?? []);

    const { data: jw } = await supabase
      .from("jawaban_user")
      .select("soal_id, jawaban")
      .eq("sesi_id", sesiId);
    if (jw) {
      const m: Record<string, string> = {};
      for (const r of jw) if (r.jawaban) m[r.soal_id] = r.jawaban;
      setJawaban(m);
    }
    setLoading(false);
  };

  // Timer
  useEffect(() => {
    if (!sesi || !paket) return;
    const start = new Date(sesi.waktu_mulai).getTime();
    const end = start + paket.durasi_menit * 60_000;

    const tick = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((end - now) / 1000));
      setRemaining(diff);
      if (diff <= 0 && !submittedRef.current) {
        submittedRef.current = true;
        toast.warning("Waktu habis! Tryout otomatis dikumpulkan.");
        void submitTryout(true);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sesi, paket]);

  const saveAnswer = async (soalId: string, ans: string) => {
    setJawaban((prev) => ({ ...prev, [soalId]: ans }));
    // upsert
    await supabase
      .from("jawaban_user")
      .upsert(
        { sesi_id: sesiId, soal_id: soalId, jawaban: ans },
        { onConflict: "sesi_id,soal_id" }
      );
  };

  const submitTryout = async (isAuto = false) => {
    if (submitting) return;
    setSubmitting(true);

    // ambil semua soal lengkap dengan jawaban benar
    const { data: allSoal } = await supabase
      .from("soal")
      .select("id, jawaban_benar")
      .eq("paket_id", sesi!.paket_id);

    let benar = 0;
    let salah = 0;
    const updates: Array<{ sesi_id: string; soal_id: string; jawaban: string | null; is_benar: boolean }> = [];
    for (const s of allSoal ?? []) {
      const ans = jawaban[s.id] ?? null;
      const isBenar = ans === s.jawaban_benar;
      if (ans) {
        if (isBenar) benar++;
        else salah++;
      }
      updates.push({ sesi_id: sesiId, soal_id: s.id, jawaban: ans, is_benar: isBenar });
    }
    // upsert semua jawaban (termasuk yang null untuk konsistensi)
    for (const u of updates) {
      if (u.jawaban) {
        await supabase
          .from("jawaban_user")
          .upsert(u, { onConflict: "sesi_id,soal_id" });
      }
    }

    const total = (allSoal?.length ?? 0);
    const skor = total > 0 ? Math.round((benar / total) * 100) : 0;

    await supabase
      .from("sesi_tryout")
      .update({
        status: "completed",
        waktu_selesai: new Date().toISOString(),
        skor,
        jumlah_benar: benar,
        jumlah_salah: salah,
      })
      .eq("id", sesiId);

    setSubmitting(false);
    if (!isAuto) toast.success("Tryout selesai dikumpulkan!");
    navigate({ to: "/hasil/$sesiId", params: { sesiId } });
  };

  const fmtTime = useMemo(() => {
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, [remaining]);

  if (loading || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (soal.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground">Belum ada soal di paket ini.</p>
        <Button className="mt-4" onClick={() => navigate({ to: "/dashboard" })}>
          Kembali ke Dashboard
        </Button>
      </div>
    );
  }

  const current = soal[currentIdx];
  const totalAnswered = Object.keys(jawaban).length;
  const lowTime = remaining <= 60;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-card shadow-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">Sedang mengerjakan</div>
            <div className="truncate font-serif text-sm font-bold sm:text-base">{paket?.judul}</div>
          </div>
          <div
            className={`flex items-center gap-2 rounded-full border px-4 py-1.5 font-mono text-lg font-bold ${
              lowTime
                ? "border-destructive bg-destructive/10 text-destructive animate-pulse"
                : "border-primary bg-primary-soft text-primary"
            }`}
          >
            <Clock className="size-4" />
            {fmtTime}
          </div>
        </div>
      </header>

      <main className="container mx-auto grid gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_280px]">
        {/* Soal */}
        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-primary">
                Soal {current.nomor} dari {soal.length}
              </span>
              <span className="text-xs text-muted-foreground">
                Terjawab: {totalAnswered}/{soal.length}
              </span>
            </div>
            <p className="mb-6 whitespace-pre-wrap text-lg leading-relaxed text-foreground">
              {current.pertanyaan}
            </p>
            <div className="space-y-2">
              {OPTS.map((opt) => {
                const text = (current as any)[`opsi_${opt.toLowerCase()}`] as string | null;
                if (!text) return null;
                const selected = jawaban[current.id] === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => saveAnswer(current.id, opt)}
                    className={`flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-all ${
                      selected
                        ? "border-primary bg-primary-soft"
                        : "border-border bg-background hover:border-primary/40 hover:bg-muted/40"
                    }`}
                  >
                    <span
                      className={`flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        selected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      {opt}
                    </span>
                    <span className="flex-1 text-sm">{text}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex items-center justify-between gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                disabled={currentIdx === 0}
              >
                Sebelumnya
              </Button>
              {currentIdx < soal.length - 1 ? (
                <Button onClick={() => setCurrentIdx((i) => Math.min(soal.length - 1, i + 1))}>
                  Selanjutnya
                </Button>
              ) : (
                <Button
                  onClick={() => submitTryout(false)}
                  disabled={submitting}
                  className="bg-success text-success-foreground hover:bg-success/90"
                >
                  {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <CheckCircle2 className="mr-2 size-4" />}
                  Kumpulkan
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sidebar nomor soal */}
        <Card className="h-fit lg:sticky lg:top-20">
          <CardContent className="p-4">
            <div className="mb-3 text-xs font-semibold uppercase text-muted-foreground">
              Navigasi Soal
            </div>
            <div className="grid grid-cols-6 gap-2 lg:grid-cols-5">
              {soal.map((s, i) => {
                const answered = !!jawaban[s.id];
                const active = i === currentIdx;
                return (
                  <button
                    key={s.id}
                    onClick={() => setCurrentIdx(i)}
                    className={`flex h-9 items-center justify-center rounded-md text-xs font-bold transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : answered
                        ? "bg-accent/20 text-accent border border-accent/40"
                        : "bg-muted text-muted-foreground hover:bg-muted/70"
                    }`}
                  >
                    {s.nomor}
                  </button>
                );
              })}
            </div>
            <Button
              className="mt-4 w-full"
              variant="default"
              onClick={() => submitTryout(false)}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Selesai & Kumpulkan
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
