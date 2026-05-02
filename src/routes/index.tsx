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
              Siap Lolos Seleksi <span className="text-primary">Kopdes Merah Putih?</span> Mulai dari Sini.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Latihan soal CBT yang nyata, terarah, dan ngena buat persiapan seleksi Koperasi Desa Merah Putih.
              Cobain dulu paket gratisnya, kalau cocok lanjut ke tryout lengkap biar makin pede pas hari-H.
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
            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
              <img
                src={heroPeserta}
                alt="Peserta tryout Koperasi Desa Merah Putih sedang menggunakan platform CBT"
                className="aspect-square w-full object-cover"
                loading="eager"
              />
            </div>
            <div className="absolute -bottom-4 -left-4 hidden rounded-2xl border border-border bg-card/95 px-4 py-3 shadow-lg backdrop-blur sm:block">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-accent" />
                <div>
                  <div className="text-xs font-semibold text-foreground">Sukses Tryout</div>
                  <div className="text-[10px] text-muted-foreground">Bersama Koperasi Merah Putih</div>
                </div>
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

      {/* PAKET PREVIEW - konversi langsung */}
      <section id="paket" className="bg-muted/30">
        <div className="container mx-auto px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              <Zap className="size-3.5" />
              Mulai sekarang — gratis tanpa kartu kredit
            </div>
            <h2 className="font-serif text-3xl font-bold sm:text-4xl">Pilih Paket Tryout-mu</h2>
            <p className="mt-3 text-muted-foreground">
              Coba <strong className="text-foreground">paket gratis</strong> dulu, atau langsung ambil paket
              premium untuk persiapan menyeluruh.
            </p>
          </div>

          {pakets.length === 0 ? (
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-64 animate-pulse rounded-2xl border border-border bg-card" />
              ))}
            </div>
          ) : (
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {pakets.map((p) => (
                <div
                  key={p.id}
                  className={`relative flex flex-col rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg ${
                    p.is_gratis ? "border-accent/40" : "border-border"
                  }`}
                >
                  {p.is_gratis && (
                    <div className="absolute -top-3 left-5 inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-accent-foreground shadow">
                      <Gift className="size-3" />
                      Gratis
                    </div>
                  )}
                  <h3 className="font-serif text-lg font-bold leading-tight">{p.judul}</h3>
                  {p.deskripsi && (
                    <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{p.deskripsi}</p>
                  )}
                  <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <ClipboardCheck className="size-3.5" /> {p.jumlah_soal} soal
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Timer className="size-3.5" /> {p.durasi_menit} mnt
                    </span>
                  </div>
                  <div className="mt-4 flex-1">
                    <div className="text-2xl font-bold text-primary">
                      {p.is_gratis ? "Gratis" : formatRupiah(p.harga)}
                    </div>
                  </div>
                  <Button asChild size="sm" className="mt-4 w-full" variant={p.is_gratis ? "default" : "outline"}>
                    <Link to="/paket">
                      {p.is_gratis ? "Kerjakan Sekarang" : "Ambil Paket"}{" "}
                      <ArrowRight className="ml-1 size-3.5" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 text-center">
            <Button asChild variant="ghost" className="gap-2">
              <Link to="/paket">
                Lihat semua paket <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>


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
