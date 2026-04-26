import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, CheckCircle2, ClipboardCheck, Gift, ShieldCheck, Sparkles, Timer, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatRupiah } from "@/lib/format";
import heroPeserta from "@/assets/hero-peserta.png";

interface PaketPreview {
  id: string;
  judul: string;
  deskripsi: string | null;
  harga: number;
  is_gratis: boolean;
  jumlah_soal: number;
  durasi_menit: number;
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CBT Tryout Koperasi Desa Merah Putih" },
      {
        name: "description",
        content:
          "Latihan CBT online untuk anggota Koperasi Desa Merah Putih. Tryout gratis & paket premium dengan pembayaran QRIS.",
      },
      { property: "og:title", content: "CBT Tryout Koperasi Desa Merah Putih" },
      {
        property: "og:description",
        content: "Tumbuh bersama, maju bersama. Asah kemampuanmu lewat tryout CBT terstruktur.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const [pakets, setPakets] = useState<PaketPreview[]>([]);

  useEffect(() => {
    supabase
      .from("paket_tryout")
      .select("id, judul, deskripsi, harga, is_gratis, jumlah_soal, durasi_menit")
      .eq("is_aktif", true)
      .order("is_gratis", { ascending: false })
      .order("harga", { ascending: true })
      .limit(4)
      .then(({ data }) => setPakets(data ?? []));
  }, []);


  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* HERO */}
      <section className="bg-gradient-hero">
        <div className="container mx-auto grid items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="size-3.5" />
              Platform tryout CBT khusus Koperasi Desa
            </div>
            <h1 className="font-serif text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl">
              Tumbuh Bersama, <span className="text-primary">Maju Bersama</span> Lewat Tryout CBT.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Asah kemampuanmu dengan latihan soal terstruktur khusus Koperasi Desa Merah Putih. Coba paket
              gratis dulu, baru lanjut ke tryout lengkap.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="gap-2">
                <Link to="/paket">
                  Mulai Tryout Gratis <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/paket">Lihat Semua Paket</Link>
              </Button>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-accent" />
                Aman & terpercaya
              </div>
              <div className="flex items-center gap-2">
                <Timer className="size-4 text-accent" />
                Timer otomatis
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-[4/3] rounded-3xl border border-border bg-gradient-to-br from-primary/15 via-card to-accent/15 p-8 shadow-xl">
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-6 grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-card p-4 shadow-md">
                    <BookOpen className="mx-auto mb-2 size-8 text-primary" />
                    <div className="text-xs font-semibold text-foreground">Bank Soal</div>
                  </div>
                  <div className="rounded-2xl bg-card p-4 shadow-md">
                    <ClipboardCheck className="mx-auto mb-2 size-8 text-accent" />
                    <div className="text-xs font-semibold text-foreground">Skor Otomatis</div>
                  </div>
                  <div className="rounded-2xl bg-card p-4 shadow-md">
                    <Timer className="mx-auto mb-2 size-8 text-warning" />
                    <div className="text-xs font-semibold text-foreground">Timer Realtime</div>
                  </div>
                  <div className="rounded-2xl bg-card p-4 shadow-md">
                    <Users className="mx-auto mb-2 size-8 text-primary" />
                    <div className="text-xs font-semibold text-foreground">Untuk Anggota</div>
                  </div>
                </div>
                <p className="font-serif text-xl font-bold text-foreground">Bersama Membangun Desa</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="container mx-auto px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-3xl font-bold sm:text-4xl">Kenapa Tryout di Sini?</h2>
          <p className="mt-3 text-muted-foreground">
            Dirancang khusus untuk membantu calon anggota Koperasi Desa Merah Putih siap menghadapi tes
            kompetensi.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: BookOpen,
              title: "Materi Khusus Koperasi",
              desc: "UU Koperasi, manajemen, akuntansi, dan tata kelola Koperasi Desa.",
            },
            {
              icon: ClipboardCheck,
              title: "Penilaian Otomatis",
              desc: "Skor & pembahasan langsung muncul setelah tryout selesai.",
            },
            {
              icon: ShieldCheck,
              title: "Pembayaran QRIS",
              desc: "Bayar mudah pakai QRIS, akses langsung diaktifkan setelah verifikasi.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <f.icon className="size-6" />
              </div>
              <h3 className="font-serif text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-warm">
        <div className="container mx-auto px-4 py-16 text-center sm:px-6">
          <h2 className="font-serif text-3xl font-bold sm:text-4xl">Siap mulai tryout sekarang?</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Daftar gratis dan langsung kerjakan paket demo untuk merasakan format tryout CBT.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/auth" search={{ mode: "signup" }}>
                Daftar Gratis
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/paket">Lihat Paket</Link>
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
