CREATE TABLE IF NOT EXISTS public.app_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  tryout_enabled boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "everyone can view app settings"
ON public.app_settings FOR SELECT
USING (true);

CREATE POLICY "admin manage app settings"
ON public.app_settings FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER app_settings_touch_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.app_settings (key, tryout_enabled)
VALUES ('global', true)
ON CONFLICT (key) DO NOTHING;