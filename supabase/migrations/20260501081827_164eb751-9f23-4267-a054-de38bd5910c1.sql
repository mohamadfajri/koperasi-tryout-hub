ALTER TABLE public.bukti_tryout_gratis 
  ADD COLUMN IF NOT EXISTS bukti_follow_url text,
  ADD COLUMN IF NOT EXISTS bukti_share_url text,
  ADD COLUMN IF NOT EXISTS bukti_like_tag_url text;