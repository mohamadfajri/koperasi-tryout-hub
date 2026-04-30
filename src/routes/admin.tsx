import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Pencil, Trash2, Eye, CheckCircle2, XCircle, Users, Package, FileQuestion, Receipt, Power } from "lucide-react";
import { toast } from "sonner";
import { formatDate, formatRupiah } from "@/lib/format";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Panel Admin — CBT Koperasi" }] }),
  component: AdminPage,
});

interface Paket { id: string; judul: string; deskripsi: string | null; harga: number; durasi_menit: number; jumlah_soal: number; max_attempts: number; is_gratis: boolean; is_aktif: boolean; execution_enabled?: boolean; }
interface Soal { id: string; paket_id: string; nomor: number; pertanyaan: string; opsi_a: string; opsi_b: string; opsi_c: string; opsi_d: string; opsi_e: string | null; jawaban_benar: string; pembahasan: string | null; pertanyaan_gambar?: string | null; opsi_a_gambar?: string | null; opsi_b_gambar?: string | null; opsi_c_gambar?: string | null; opsi_d_gambar?: string | null; opsi_e_gambar?: string | null; pembahasan_gambar?: string | null; }
interface Bayar { id: string; user_id: string; paket_id: string; nominal: number; bukti_url: string | null; status: "pending" | "approved" | "rejected"; catatan_admin: string | null; created_at: string; profiles: { full_name: string | null; email: string | null } | null; paket_tryout: { judul: string } | null; }
interface UserRow { id: string; full_name: string | null; email: string | null; phone: string | null; created_at: string; sesi_count: number; }
interface AppSettings { key: string; tryout_enabled: boolean; }

function AdminPage() {
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate({ to: "/auth", search: { mode: "login", redirect: "/admin" } }); return; }
    if (role !== "admin") { toast.error("Akses ditolak. Hanya untuk admin."); navigate({ to: "/dashboard" }); }
  }, [authLoading, user, role]);

  if (authLoading || role !== "admin") {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="size-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto px-4 py-10 sm:px-6">
        <h1 className="font-serif text-3xl font-bold">Panel Admin</h1>
        <p className="mb-8 text-muted-foreground">Kelola paket, soal, monitoring user, dan verifikasi pembayaran.</p>

        <div className="mb-6">
          <TryoutToggleCard />
        </div>

        <Tabs defaultValue="pembayaran">
          <TabsList className="mb-6 grid w-full grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="pembayaran"><Receipt className="mr-2 size-4" />Pembayaran</TabsTrigger>
            <TabsTrigger value="paket"><Package className="mr-2 size-4" />Paket</TabsTrigger>
            <TabsTrigger value="soal"><FileQuestion className="mr-2 size-4" />Soal</TabsTrigger>
            <TabsTrigger value="user"><Users className="mr-2 size-4" />User</TabsTrigger>
          </TabsList>
          <TabsContent value="pembayaran"><PembayaranTab /></TabsContent>
          <TabsContent value="paket"><PaketTab /></TabsContent>
          <TabsContent value="soal"><SoalTab /></TabsContent>
          <TabsContent value="user"><UserTab /></TabsContent>
        </Tabs>
      </main>
      <SiteFooter />
    </div>
  );
}

function TryoutToggleCard() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("app_settings")
      .select("key, tryout_enabled")
      .eq("key", "global")
      .maybeSingle();

    if (error) {
      toast.error("Gagal memuat pengaturan tryout: " + error.message);
      setLoading(false);
      return;
    }

    setSettings(data ?? { key: "global", tryout_enabled: true });
    setLoading(false);
  };

  const toggle = async (enabled: boolean) => {
    setSaving(true);
    const { error } = await supabase
      .from("app_settings")
      .upsert({ key: "global", tryout_enabled: enabled }, { onConflict: "key" });

    setSaving(false);

    if (error) {
      toast.error("Gagal memperbarui status tryout: " + error.message);
      return;
    }

    setSettings({ key: "global", tryout_enabled: enabled });
    toast.success(enabled ? "Tryout dibuka untuk peserta." : "Tryout ditutup sementara.");
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Power className="size-4" />
            Pengaturan Tryout
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Gunakan saklar ini untuk membuka atau menutup seluruh pengerjaan tryout bagi peserta.
          </p>
        </div>
        {loading ? (
          <Loader2 className="size-5 animate-spin text-primary" />
        ) : (
          <Badge variant={settings?.tryout_enabled ? "default" : "outline"}>
            {settings?.tryout_enabled ? "Tryout ON" : "Tryout OFF"}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          {settings?.tryout_enabled
            ? "Peserta bisa memulai dan melanjutkan tryout."
            : "Peserta tidak bisa memulai atau melanjutkan tryout sampai diaktifkan kembali."}
        </div>
        <label className="flex items-center gap-3 text-sm font-medium">
          <span>{settings?.tryout_enabled ? "Aktif" : "Nonaktif"}</span>
          <Switch
            checked={settings?.tryout_enabled ?? true}
            disabled={loading || saving}
            onCheckedChange={toggle}
          />
          {saving && <Loader2 className="size-4 animate-spin text-primary" />}
        </label>
      </CardContent>
    </Card>
  );
}

/* ============ PEMBAYARAN ============ */
function PembayaranTab() {
  const { user } = useAuth();
  const [list, setList] = useState<Bayar[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selected, setSelected] = useState<Bayar | null>(null);
  const [catatan, setCatatan] = useState("");
  const [acting, setActing] = useState(false);

  const load = async () => {
    setLoading(true);
    let q = supabase.from("pembayaran")
      .select("*, paket_tryout(judul)")
      .order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter);
    const { data, error } = await q;
    if (error) toast.error("Gagal memuat: " + error.message);
    const rows = (data as any[]) ?? [];

    // Fetch profiles separately (no FK relationship in schema cache)
    const userIds = Array.from(new Set(rows.map((r) => r.user_id).filter(Boolean)));
    if (userIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);
      const profMap = new Map((profs ?? []).map((p) => [p.id, p]));
      rows.forEach((r) => {
        const p = profMap.get(r.user_id);
        r.profiles = p ? { full_name: p.full_name, email: p.email } : null;
      });
    }

    setList(rows);
    setLoading(false);

    // Pre-generate signed URLs for thumbnails
    const map: Record<string, string> = {};
    await Promise.all(
      rows
        .filter((r) => r.bukti_url)
        .map(async (r) => {
          const { data: signed } = await supabase.storage
            .from("payment-proofs")
            .createSignedUrl(r.bukti_url, 600);
          if (signed?.signedUrl) map[r.id] = signed.signedUrl;
        })
    );
    setThumbs(map);
  };
  useEffect(() => { void load(); }, [filter]);

  const decide = async (status: "approved" | "rejected") => {
    if (!selected || !user) return;
    setActing(true);
    const { error } = await supabase.from("pembayaran").update({
      status, catatan_admin: catatan || null, verified_by: user.id, verified_at: new Date().toISOString(),
    }).eq("id", selected.id);
    setActing(false);
    if (error) { toast.error("Gagal: " + error.message); return; }
    toast.success(`Pembayaran ${status === "approved" ? "disetujui" : "ditolak"}.`);
    setSelected(null); setCatatan(""); void load();
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4">
        <CardTitle className="text-base">Verifikasi Pembayaran</CardTitle>
        <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Menunggu</SelectItem>
            <SelectItem value="approved">Disetujui</SelectItem>
            <SelectItem value="rejected">Ditolak</SelectItem>
            <SelectItem value="all">Semua</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {loading ? <Loader2 className="mx-auto size-5 animate-spin" /> : list.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Tidak ada data.</p>
        ) : (
          <div className="space-y-3">
            {list.map((b) => (
              <div key={b.id} className="flex flex-wrap items-start gap-3 rounded-lg border border-border p-3">
                {b.bukti_url ? (
                  thumbs[b.id] ? (
                    <button
                      type="button"
                      onClick={() => setPreviewUrl(thumbs[b.id])}
                      className="size-20 shrink-0 overflow-hidden rounded-md border border-border bg-muted"
                      title="Klik untuk perbesar"
                    >
                      <img src={thumbs[b.id]} alt="Bukti" className="size-full object-cover" />
                    </button>
                  ) : (
                    <div className="flex size-20 shrink-0 items-center justify-center rounded-md border border-border bg-muted">
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    </div>
                  )
                ) : (
                  <div className="flex size-20 shrink-0 items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground">
                    Tanpa bukti
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{b.profiles?.full_name || b.profiles?.email || "(tanpa nama)"}</div>
                  <div className="text-xs text-muted-foreground">{b.profiles?.email}</div>
                  <div className="mt-1 text-sm">{b.paket_tryout?.judul} · <b>{formatRupiah(b.nominal)}</b></div>
                  <div className="text-xs text-muted-foreground">{formatDate(b.created_at)}</div>
                  {b.catatan_admin && <div className="mt-1 text-xs italic text-muted-foreground">Catatan: {b.catatan_admin}</div>}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="outline" className={
                    b.status === "approved" ? "border-success text-success"
                    : b.status === "rejected" ? "border-destructive text-destructive"
                    : "border-warning text-warning-foreground"
                  }>{b.status === "pending" ? "menunggu" : b.status === "approved" ? "disetujui" : "ditolak"}</Badge>
                  <div className="flex gap-2">
                    {b.bukti_url && thumbs[b.id] && (
                      <Button size="sm" variant="outline" onClick={() => setPreviewUrl(thumbs[b.id])}>
                        <Eye className="mr-1 size-4" />Lihat
                      </Button>
                    )}
                    {b.status === "pending" && (
                      <Button size="sm" onClick={() => { setSelected(b); setCatatan(""); }}>
                        <CheckCircle2 className="mr-1 size-4" />Verifikasi
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={!!previewUrl} onOpenChange={(o) => !o && setPreviewUrl(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Bukti Pembayaran</DialogTitle></DialogHeader>
          {previewUrl && <img src={previewUrl} alt="Bukti" className="mx-auto max-h-[70vh] rounded-lg" />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) { setSelected(null); setCatatan(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verifikasi Pembayaran</DialogTitle>
            <DialogDescription>
              {selected?.profiles?.full_name || selected?.profiles?.email} · {selected?.paket_tryout?.judul} · {selected && formatRupiah(selected.nominal)}
            </DialogDescription>
          </DialogHeader>
          {selected?.bukti_url && thumbs[selected.id] && (
            <img src={thumbs[selected.id]} alt="Bukti" className="mx-auto max-h-64 rounded-lg border border-border" />
          )}
          <div className="space-y-2">
            <Label>Catatan (opsional)</Label>
            <Textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Misal: terverifikasi via mutasi rekening" />
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" className="text-destructive" disabled={acting} onClick={() => decide("rejected")}>
              <XCircle className="mr-2 size-4" />Tolak
            </Button>
            <Button disabled={acting} onClick={() => decide("approved")}>
              {acting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <CheckCircle2 className="mr-2 size-4" />}
              Setujui
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/* ============ PAKET ============ */
function PaketTab() {
  const [list, setList] = useState<Paket[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Paket | null>(null);
  const [open, setOpen] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data: paketData } = await supabase.from("paket_tryout").select("*").order("created_at", { ascending: false });
    setList(
      ((paketData as Paket[]) ?? []).map((paket) => ({
        ...paket,
        execution_enabled: paket.max_attempts >= 0,
      })),
    );
    setLoading(false);
  };
  useEffect(() => { void load(); }, []);

  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      judul: String(fd.get("judul") || "").trim(),
      deskripsi: String(fd.get("deskripsi") || ""),
      harga: Number(fd.get("harga") || 0),
      durasi_menit: Number(fd.get("durasi") || 60),
      jumlah_soal: Number(fd.get("jumlah") || 50),
      max_attempts: Number(fd.get("max_attempts") || 0),
      is_gratis: fd.get("is_gratis") === "on",
      is_aktif: fd.get("is_aktif") === "on",
    };
    if (!payload.judul) { toast.error("Judul wajib diisi"); return; }
    const res = editing
      ? await supabase.from("paket_tryout").update(payload).eq("id", editing.id)
      : await supabase.from("paket_tryout").insert(payload);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success("Tersimpan"); setOpen(false); setEditing(null); void load();
  };

  const remove = async (id: string) => {
    if (!confirm("Hapus paket ini? Semua soal & sesi terkait juga akan terhapus.")) return;
    const { error } = await supabase.from("paket_tryout").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Paket dihapus"); void load(); }
  };

  const toggleExecution = async (paketId: string, enabled: boolean) => {
    const current = list.find((paket) => paket.id === paketId);
    if (!current) return;
    setTogglingId(paketId);
    const { error } = await supabase
      .from("paket_tryout")
      .update({ max_attempts: enabled ? Math.max(current.max_attempts, 0) : -1 })
      .eq("id", paketId);
    setTogglingId(null);
    if (error) {
      toast.error("Gagal memperbarui status pengerjaan: " + error.message);
      return;
    }
    setList((prev) =>
      prev.map((paket) =>
        paket.id === paketId
          ? {
              ...paket,
              execution_enabled: enabled,
              max_attempts: enabled ? Math.max(paket.max_attempts, 0) : -1,
            }
          : paket,
      ),
    );
    toast.success(enabled ? "Pengerjaan tryout diaktifkan." : "Pengerjaan tryout dimatikan.");
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">Daftar Paket</CardTitle>
        <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="mr-1 size-4" />Tambah Paket
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? <Loader2 className="mx-auto size-5 animate-spin" /> : (
          <div className="space-y-2">
            {list.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold">{p.judul}</div>
                    {p.is_gratis && <Badge className="bg-accent text-accent-foreground">GRATIS</Badge>}
                    {!p.is_aktif && <Badge variant="outline">nonaktif</Badge>}
                    {p.is_aktif && !p.execution_enabled && <Badge variant="secondary">pengerjaan off</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatRupiah(p.harga)} · {p.durasi_menit} menit · {p.jumlah_soal} soal ·{" "}
                    {(p.execution_enabled ?? true)
                      ? p.max_attempts === 0
                        ? "tanpa batas"
                        : `maks ${p.max_attempts}× pengerjaan`
                      : "pengerjaan dimatikan"}
                  </div>
                </div>
                <label className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Pengerjaan</span>
                  <Switch
                    checked={p.execution_enabled ?? true}
                    disabled={togglingId === p.id}
                    onCheckedChange={(checked) => void toggleExecution(p.id, checked)}
                  />
                  <span className="font-medium">{p.execution_enabled ? "ON" : "OFF"}</span>
                  {togglingId === p.id && <Loader2 className="size-4 animate-spin text-primary" />}
                </label>
                <Button size="sm" variant="outline" onClick={() => { setEditing(p); setOpen(true); }}>
                  <Pencil className="mr-1 size-4" />Edit
                </Button>
                <Button size="sm" variant="outline" className="text-destructive" onClick={() => remove(p.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Paket" : "Paket Baru"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-3">
            <div className="space-y-1.5"><Label>Judul</Label><Input name="judul" required defaultValue={editing?.judul} /></div>
            <div className="space-y-1.5"><Label>Deskripsi</Label><Textarea name="deskripsi" defaultValue={editing?.deskripsi ?? ""} /></div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="space-y-1.5"><Label>Harga (Rp)</Label><Input name="harga" type="number" min="0" defaultValue={editing?.harga ?? 0} /></div>
              <div className="space-y-1.5"><Label>Durasi (menit)</Label><Input name="durasi" type="number" min="1" defaultValue={editing?.durasi_menit ?? 60} /></div>
              <div className="space-y-1.5"><Label>Jumlah soal</Label><Input name="jumlah" type="number" min="1" defaultValue={editing?.jumlah_soal ?? 50} /></div>
              <div className="space-y-1.5"><Label>Batas kerja</Label><Input name="max_attempts" type="number" min="0" defaultValue={editing?.max_attempts ?? 0} title="0 = tanpa batas" /></div>
            </div>
            <p className="text-xs text-muted-foreground">Batas kerja: isi <b>0</b> untuk tanpa batas, atau angka lain untuk membatasi berapa kali user bisa mengerjakan paket ini.</p>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm"><Switch name="is_gratis" defaultChecked={editing?.is_gratis ?? false} />Gratis</label>
              <label className="flex items-center gap-2 text-sm"><Switch name="is_aktif" defaultChecked={editing?.is_aktif ?? true} />Aktif</label>
            </div>
            <DialogFooter><Button type="submit">Simpan</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/* ============ SOAL ============ */
function SoalTab() {
  const [paket, setPaket] = useState<Paket[]>([]);
  const [paketId, setPaketId] = useState<string>("");
  const [list, setList] = useState<Soal[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Soal | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabase.from("paket_tryout").select("*").order("judul").then(({ data }) => {
      setPaket((data as Paket[]) ?? []);
      if (data && data.length > 0 && !paketId) setPaketId(data[0].id);
    });
  }, []);

  const load = async () => {
    if (!paketId) return;
    setLoading(true);
    const { data } = await supabase.from("soal").select("*").eq("paket_id", paketId).order("nomor");
    setList((data as Soal[]) ?? []); setLoading(false);
  };
  useEffect(() => { void load(); }, [paketId]);

  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      paket_id: paketId,
      nomor: Number(fd.get("nomor") || 1),
      pertanyaan: String(fd.get("pertanyaan") || "").trim(),
      opsi_a: String(fd.get("a") || "").trim(),
      opsi_b: String(fd.get("b") || "").trim(),
      opsi_c: String(fd.get("c") || "").trim(),
      opsi_d: String(fd.get("d") || "").trim(),
      opsi_e: String(fd.get("e") || "").trim() || null,
      jawaban_benar: String(fd.get("jawaban") || "A"),
      pembahasan: String(fd.get("pembahasan") || "") || null,
    };
    const res = editing
      ? await supabase.from("soal").update(payload).eq("id", editing.id)
      : await supabase.from("soal").insert(payload);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success("Tersimpan"); setOpen(false); setEditing(null); void load();
  };

  const remove = async (id: string) => {
    if (!confirm("Hapus soal ini?")) return;
    const { error } = await supabase.from("soal").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Soal dihapus"); void load(); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Bank Soal</CardTitle>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Select value={paketId} onValueChange={setPaketId}>
            <SelectTrigger className="w-72"><SelectValue placeholder="Pilih paket" /></SelectTrigger>
            <SelectContent>
              {paket.map((p) => <SelectItem key={p.id} value={p.id}>{p.judul}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" disabled={!paketId} onClick={() => {
            setEditing(null); setOpen(true);
          }}><Plus className="mr-1 size-4" />Tambah Soal</Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? <Loader2 className="mx-auto size-5 animate-spin" /> : list.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Belum ada soal di paket ini.</p>
        ) : (
          <div className="space-y-2">
            {list.map((s) => (
              <div key={s.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
                <div className="font-bold text-primary">#{s.nomor}</div>
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-2 text-sm">{s.pertanyaan}</div>
                  <div className="mt-1 text-xs text-muted-foreground">Jawaban benar: <b>{s.jawaban_benar}</b></div>
                </div>
                <Button size="sm" variant="outline" onClick={() => { setEditing(s); setOpen(true); }}>
                  <Pencil className="size-4" />
                </Button>
                <Button size="sm" variant="outline" className="text-destructive" onClick={() => remove(s.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? `Edit Soal #${editing.nomor}` : "Soal Baru"}</DialogTitle></DialogHeader>
          <form onSubmit={save} className="space-y-3">
            <div className="grid grid-cols-4 gap-3">
              <div className="space-y-1.5 col-span-1"><Label>Nomor</Label><Input name="nomor" type="number" min="1" required defaultValue={editing?.nomor ?? (list.length + 1)} /></div>
              <div className="space-y-1.5 col-span-3"><Label>Jawaban Benar</Label>
                <Select name="jawaban" defaultValue={editing?.jawaban_benar ?? "A"}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["A","B","C","D","E"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label>Pertanyaan</Label><Textarea name="pertanyaan" rows={3} required defaultValue={editing?.pertanyaan} /></div>
            {(["a","b","c","d","e"] as const).map((k) => (
              <div key={k} className="space-y-1.5"><Label>Opsi {k.toUpperCase()}{k === "e" && " (opsional)"}</Label>
                <Input name={k} required={k !== "e"} defaultValue={(editing as any)?.[`opsi_${k}`] ?? ""} />
              </div>
            ))}
            <div className="space-y-1.5"><Label>Pembahasan (opsional)</Label><Textarea name="pembahasan" defaultValue={editing?.pembahasan ?? ""} /></div>
            <DialogFooter><Button type="submit">Simpan</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/* ============ USER ============ */
function UserTab() {
  const [list, setList] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { void load(); }, []);
  const load = async () => {
    setLoading(true);
    const { data: profs } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    const { data: sesi } = await supabase.from("sesi_tryout").select("user_id");
    const counts = new Map<string, number>();
    for (const s of sesi ?? []) counts.set(s.user_id, (counts.get(s.user_id) ?? 0) + 1);
    setList((profs ?? []).map((p: any) => ({ ...p, sesi_count: counts.get(p.id) ?? 0 })));
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Daftar Pengguna ({list.length})</CardTitle></CardHeader>
      <CardContent>
        {loading ? <Loader2 className="mx-auto size-5 animate-spin" /> : list.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Belum ada pengguna terdaftar.</p>
        ) : (
          <div className="space-y-2">
            {list.map((u) => (
              <div key={u.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary-soft font-bold text-primary">
                  {(u.full_name || u.email || "?").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{u.full_name || "(tanpa nama)"}</div>
                  <div className="text-xs text-muted-foreground">{u.email} · {u.phone || "—"}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-primary">{u.sesi_count}</div>
                  <div className="text-xs text-muted-foreground">tryout</div>
                </div>
                <div className="text-xs text-muted-foreground">{formatDate(u.created_at)}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
