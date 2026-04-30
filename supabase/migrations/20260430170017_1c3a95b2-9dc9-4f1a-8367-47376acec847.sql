-- Tabel bukti tryout gratis
CREATE TABLE IF NOT EXISTS public.bukti_tryout_gratis (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  paket_id uuid,
  ig_username text NOT NULL,
  bukti_image_url text,
  status text NOT NULL DEFAULT 'pending',
  catatan_admin text,
  verified_at timestamp with time zone,
  verified_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.bukti_tryout_gratis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users insert own bukti"
ON public.bukti_tryout_gratis FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users view own bukti"
ON public.bukti_tryout_gratis FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admin manage bukti"
ON public.bukti_tryout_gratis FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER bukti_tryout_gratis_touch_updated_at
BEFORE UPDATE ON public.bukti_tryout_gratis
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('bukti-tryout-gratis', 'bukti-tryout-gratis', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "public read bukti tryout gratis"
ON storage.objects FOR SELECT
USING (bucket_id = 'bukti-tryout-gratis');

CREATE POLICY "auth upload bukti tryout gratis"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'bukti-tryout-gratis' AND auth.uid() IS NOT NULL);