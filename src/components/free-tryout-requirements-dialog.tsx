import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Instagram, Share2, Heart, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmed: () => void;
  paketJudul?: string;
}

const IG_URL = "https://instagram.com/tryoutkopdes_com";
const IG_HANDLE = "@tryoutkopdes_com";

export function FreeTryoutRequirementsDialog({ open, onOpenChange, onConfirmed, paketJudul }: Props) {
  const [step1, setStep1] = useState(false);
  const [step2, setStep2] = useState(false);
  const [step3, setStep3] = useState(false);
  const [igUsername, setIgUsername] = useState("");
  const [taggedAccounts, setTaggedAccounts] = useState("");

  const allChecked = step1 && step2 && step3;
  const formValid = allChecked && igUsername.trim().length >= 2 && taggedAccounts.trim().length >= 2;

  const handleSubmit = () => {
    if (!formValid) {
      toast.error("Lengkapi semua persyaratan dulu ya!");
      return;
    }
    // Simpan bukti konfirmasi di localStorage
    try {
      localStorage.setItem(
        "free_tryout_requirements",
        JSON.stringify({
          ig_username: igUsername.trim(),
          tagged_accounts: taggedAccounts.trim(),
          confirmed_at: new Date().toISOString(),
        }),
      );
    } catch {
      /* ignore */
    }
    toast.success("Terima kasih sudah mendukung! Tryout dimulai…");
    onConfirmed();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
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
              <Label htmlFor="tagged" className="text-xs">3 akun yang kamu tag</Label>
              <Input
                id="tagged"
                placeholder="@temen1, @temen2, @temen3"
                value={taggedAccounts}
                onChange={(e) => setTaggedAccounts(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={handleSubmit} disabled={!formValid}>
            Konfirmasi & Mulai Tryout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
