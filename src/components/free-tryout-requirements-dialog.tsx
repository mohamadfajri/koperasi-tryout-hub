import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Instagram, Share2, Heart, ExternalLink, Upload, Loader2, X, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth-context";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmed: () => void;
  paketJudul?: string;
  paketId?: string;
}

const IG_URL = "https://instagram.com/tryoutkopdes";
const IG_HANDLE = "@tryoutkopdes";

type StepKey = "follow" | "share" | "like";
const STEPS: { key: StepKey; title: string; desc: string; icon: typeof Instagram }[] = [
  { key: "follow", title: `Follow Instagram ${IG_HANDLE}`, desc: "Upload screenshot halaman profil yang sudah di-follow.", icon: Instagram },
  { key: "share", title: "Share gambar promo ke grup KOPDES/SPPI", desc: "Upload screenshot share di grup WhatsApp/Telegram.", icon: Share2 },
  { key: "like", title: `Like & tag 3 orang di postingan ${IG_HANDLE}`, desc: "Upload screenshot komentar yang men-tag 3 akun.", icon: Heart },
];

export function FreeTryoutRequirementsDialog({ open, onOpenChange, onConfirmed, paketJudul, paketId }: Props) {
  const { user } = useAuth();
  const [igUsername, setIgUsername] = useState("");
  const [files, setFiles] = useState<Record<StepKey, File | null>>({ follow: null, share: null, like: null });
  const [previews, setPreviews] = useState<Record<StepKey, string | null>>({ follow: null, share: null, like: null });
  const [submitting, setSubmitting] = useState(false);
  const inputRefs = useRef<Record<StepKey, HTMLInputElement | null>>({ follow: null, share: null, like: null });

  const formValid =
    igUsername.trim().length >= 2 && files.follow !== null && files.share !== null && files.like !== null;

  const setFileFor = (key: StepKey, file: File | null) => {
    if (file) {
      if (!file.type.startsWith("image/")) { toast.error("File harus gambar"); return; }
      if (file.size > 5 * 1024 * 1024) { toast.error("Maksimal 5MB"); return; }
    }
    setFiles((p) => ({ ...p, [key]: file }));
    setPreviews((p) => {
      if (p[key]) URL.revokeObjectURL(p[key]!);
      return { ...p, [key]: file ? URL.createObjectURL(file) : null };
    });
  };

  const uploadOne = async (file: File, label: string) => {
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${user!.id}/${Date.now()}-${label}.${ext}`;
    const { error } = await supabase.storage.from("bukti-tryout-gratis").upload(path, file, { upsert: false });
    if (error) throw error;
    const { data } = supabase.storage.from("bukti-tryout-gratis").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async () => {
    if (!formValid || !user) { toast.error("Lengkapi semua bukti dulu ya!"); return; }
    setSubmitting(true);
    try {
      const [followUrl, shareUrl, likeUrl] = await Promise.all([
        uploadOne(files.follow!, "follow"),
        uploadOne(files.share!, "share"),
        uploadOne(files.like!, "like"),
      ]);

      const { error: insErr } = await supabase.from("bukti_tryout_gratis").insert({
        user_id: user.id,
        paket_id: paketId ?? null,
        ig_username: igUsername.trim(),
        bukti_image_url: shareUrl, // backward compat (utama)
        bukti_follow_url: followUrl,
        bukti_share_url: shareUrl,
        bukti_like_tag_url: likeUrl,
        status: "pending",
      });
      if (insErr) throw insErr;

      toast.success("Bukti terkirim! Menunggu verifikasi admin.");
      onConfirmed();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Gagal mengirim bukti";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Syarat Tryout Gratis</DialogTitle>
          <DialogDescription>
            {paketJudul ? <>Untuk mengakses <strong>{paketJudul}</strong> gratis, </> : null}
            upload bukti untuk masing-masing 3 langkah berikut. Setelah dikirim, admin akan memverifikasi terlebih dahulu sebelum kamu bisa mengerjakan tryout.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-lg border border-border p-3">
            <Label htmlFor="ig_username" className="text-xs">Username Instagram kamu</Label>
            <Input
              id="ig_username"
              placeholder="@username_kamu"
              value={igUsername}
              onChange={(e) => setIgUsername(e.target.value)}
              className="mt-1.5"
            />
          </div>

          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            const file = files[s.key];
            const preview = previews[s.key];
            return (
              <div key={s.key} className="rounded-lg border border-border p-3">
                <div className="flex items-start gap-3">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 font-medium text-sm">
                      <Icon className="size-4 text-primary shrink-0" />
                      <span className="break-words">{s.title}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{s.desc}</p>
                    {s.key === "follow" && (
                      <a href={IG_URL} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-primary underline">
                        Buka Instagram <ExternalLink className="size-3" />
                      </a>
                    )}
                  </div>
                  <div className="shrink-0">
                    <input
                      ref={(el) => { inputRefs.current[s.key] = el; }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setFileFor(s.key, e.target.files?.[0] ?? null)}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant={file ? "secondary" : "default"}
                      onClick={() => inputRefs.current[s.key]?.click()}
                    >
                      {file ? <CheckCircle2 className="mr-1 size-4" /> : <Upload className="mr-1 size-4" />}
                      {file ? "Ganti" : "Upload"}
                    </Button>
                  </div>
                </div>

                {preview && (
                  <div className="relative mt-3">
                    <img src={preview} alt={s.title} className="max-h-40 w-full rounded-md border border-border object-contain bg-background" />
                    <button
                      type="button"
                      onClick={() => setFileFor(s.key, null)}
                      className="absolute right-2 top-2 rounded-full bg-background/90 p-1 shadow hover:bg-background"
                      aria-label="Hapus"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Batal</Button>
          <Button onClick={handleSubmit} disabled={!formValid || submitting}>
            {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Kirim Bukti
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
