import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, QrCode, Info } from "lucide-react";
import { toast } from "sonner";
import { formatRupiah } from "@/lib/format";

export const Route = createFileRoute("/bayar/$paketId")({
  head: () => ({ meta: [{ title: "Pembayaran QRIS — CBT Koperasi" }] }),
  component: BayarPage,
});

interface Paket {
  id: string;
  judul: string;
  harga: number;
  is_gratis: boolean;
}

function BayarPage() {
  const { paketId } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [paket, setPaket] = useState<Paket | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/auth", search: { mode: "login", redirect: `/bayar/${paketId}` } });
      return;
    }
    void load();
  }, [authLoading, user, paketId]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("paket_tryout")
      .select("id, judul, harga, is_gratis")
      .eq("id", paketId)
      .single();
    if (!data || data.is_gratis) {
      navigate({ to: "/paket" });
      return;
    }
    setPaket(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !paket) return;
    if (!file) {
      toast.error("Mohon upload bukti pembayaran QRIS.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5 MB.");
      return;
    }
    setSubmitting(true);

    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("payment-proofs")
      .upload(path, file, { contentType: file.type });
    if (upErr) {
      toast.error("Gagal upload bukti: " + upErr.message);
      setSubmitting(false);
      return;
    }

    const { error: insErr } = await supabase.from("pembayaran").insert({
      user_id: user.id,
      paket_id: paket.id,
      nominal: paket.harga,
      bukti_url: path,
      status: "pending",
    });

    setSubmitting(false);
    if (insErr) {
      toast.error("Gagal mengirim pembayaran: " + insErr.message);
      return;
    }
    toast.success("Bukti pembayaran terkirim! Menunggu verifikasi admin.");
    navigate({ to: "/dashboard" });
  };

  if (loading || authLoading || !paket) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="mb-6">
          <Link to="/paket" className="text-sm text-muted-foreground hover:text-primary">
            ← Kembali ke daftar paket
          </Link>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Pembayaran Paket</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-lg font-semibold">{paket.judul}</div>
            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-muted-foreground">Total Bayar</span>
              <span className="font-serif text-2xl font-bold text-primary">
                {formatRupiah(paket.harga)}
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <QrCode className="size-5 text-primary" /> Scan Qris (Kios Iqbal)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-border bg-white p-4">
                <img src="/qris-kios-iqbal.png" alt="QRIS Kios Iqbal" className="mx-auto w-full max-w-[260px]" />
              </div>
              <div className="mt-4 rounded-lg bg-warning/10 p-3 text-xs text-warning-foreground">
                <div className="flex gap-2">
                  <Info className="size-4 shrink-0 text-warning" />
                  <div>
                    <p className="font-semibold">Petunjuk:</p>
                    <ol className="mt-1 list-inside list-decimal space-y-0.5">
                      <li>Scan QRIS di atas dengan aplikasi e-wallet/m-banking.</li>
                      <li>Bayar sesuai nominal: <b>{formatRupiah(paket.harga)}</b></li>
                      <li>Screenshot bukti pembayaran.</li>
                      <li>Upload bukti di form sebelah kanan.</li>
                    </ol>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Upload className="size-5 text-primary" /> Upload Bukti
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bukti">Bukti Pembayaran (gambar, maks 5 MB)</Label>
                  <Input
                    id="bukti"
                    type="file"
                    accept="image/*"
                    required
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </div>
                {file && (
                  <div className="rounded-md border border-border bg-muted/40 p-3 text-xs">
                    File: <b>{file.name}</b> ({(file.size / 1024).toFixed(0)} KB)
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Kirim Bukti Pembayaran
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Akses paket aktif setelah admin verifikasi (biasanya &lt; 1 jam).
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
