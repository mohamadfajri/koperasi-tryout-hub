import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Instagram, Share2, Heart, ExternalLink, Upload, Loader2, X } from "lucide-react";
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

const IG_URL = "https://instagram.com/tryoutkopdes_com";
const IG_HANDLE = "@tryoutkopdes_com";

export function FreeTryoutRequirementsDialog({ open, onOpenChange, onConfirmed, paketJudul, paketId }: Props) {
  const { user } = useAuth();
  const [step1, setStep1] = useState(false);
  const [step2, setStep2] = useState(false);
  const [step3, setStep3] = useState(false);
  const [igUsername, setIgUsername] = useState("");
  const [buktiFile, setBuktiFile] = useState<File | null>(null);
  const [buktiPreview, setBuktiPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const allChecked = step1 && step2 && step3;
  const formValid = allChecked && igUsername.trim().length >= 2 && !!buktiFile;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Maksimal 5MB");
      return;
    }
    setBuktiFile(file);
    setBuktiPreview(URL.createObjectURL(file));
  };

  const clearFile = () => {
    setBuktiFile(null);
    if (buktiPreview) URL.revokeObjectURL(buktiPreview);
    setBuktiPreview(null);
  };

  const handleSubmit = async () => {
    if (!formValid || !user || !buktiFile) {
      toast.error("Lengkapi semua persyaratan dulu ya!");
      return;
    }
    setSubmitting(true);
    try {
      // Upload bukti ke storage
      const ext = buktiFile.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("bukti-tryout-gratis")
        .upload(path, buktiFile, { upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("bukti-tryout-gratis").getPublicUrl(path);

      // Simpan record agar muncul di admin
      const { error: insErr } = await supabase.from("bukti_tryout_gratis").insert({
        user_id: user.id,
        paket_id: paketId ?? null,
        ig_username: igUsername.trim(),
        bukti_image_url: pub.publicUrl,
        status: "pending",
      });
      if (insErr) throw insErr;

      try {
        localStorage.setItem(
          "free_tryout_requirements",
          JSON.stringify({ ig_username: igUsername.trim(), confirmed_at: new Date().toISOString() }),
        );
      } catch { /* ignore */ }

      toast.success("Terima kasih! Bukti dikirim ke admin. Tryout dimulai…");
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
            {paketJudul ? <>Untuk mengakses <strong>{paketJudul}</strong> secara gratis, </> : null}
            selesaikan 3 langkah dukungan berikut. Cuma butuh 1 menit ✨
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Step 1 */}
          <div className="rounded-lg border border-border p-3">
            <div className="flex items-start gap-3">
              <Checkbox id="s1" checked={step1} onCheckedChange={(v) => setStep1(!!v)} className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="s1" className="flex items-center gap-2 font-medium">
                  <Instagram className="size-4 text-primary" />
                  Follow Instagram {IG_HANDLE}
                </Label>
                <a
                  href={IG_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs text-primary underline"
                >
                  Buka Instagram <ExternalLink className="size-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="rounded-lg border border-border p-3">
            <div className="flex items-start gap-3">
              <Checkbox id="s2" checked={step2} onCheckedChange={(v) => setStep2(!!v)} className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="s2" className="flex items-center gap-2 font-medium">
                  <Share2 className="size-4 text-primary" />
                  Share gambar promo ke grup KOPDES/SPPI
                </Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  Bagikan ke minimal 1 grup WhatsApp atau Telegram milikmu.
                </p>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="rounded-lg border border-border p-3">
            <div className="flex items-start gap-3">
              <Checkbox id="s3" checked={step3} onCheckedChange={(v) => setStep3(!!v)} className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="s3" className="flex items-center gap-2 font-medium">
                  <Heart className="size-4 text-primary" />
                  Like & tag 3 orang di postingan {IG_HANDLE}
                </Label>
              </div>
            </div>
          </div>

          {/* Form bukti */}
          <div className="space-y-3 rounded-lg bg-muted/50 p-3">
            <div className="space-y-1.5">
              <Label htmlFor="ig_username" className="text-xs">Username Instagram kamu</Label>
              <Input
                id="ig_username"
                placeholder="@username_kamu"
                value={igUsername}
                onChange={(e) => setIgUsername(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bukti" className="text-xs">Upload bukti share (screenshot grup)</Label>
              {buktiPreview ? (
                <div className="relative">
                  <img src={buktiPreview} alt="Bukti" className="max-h-48 w-full rounded-md border border-border object-contain bg-background" />
                  <button
                    type="button"
                    onClick={clearFile}
                    className="absolute right-2 top-2 rounded-full bg-background/90 p-1 shadow hover:bg-background"
                    aria-label="Hapus gambar"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="bukti"
                  className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-border bg-background p-4 text-xs text-muted-foreground hover:bg-muted/50"
                >
                  <Upload className="size-5" />
                  <span>Klik untuk pilih gambar</span>
                  <span className="text-[10px]">PNG/JPG, maks 5MB</span>
                </label>
              )}
              <input
                id="bukti"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Batal</Button>
          <Button onClick={handleSubmit} disabled={!formValid || submitting}>
            {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Konfirmasi & Mulai Tryout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
