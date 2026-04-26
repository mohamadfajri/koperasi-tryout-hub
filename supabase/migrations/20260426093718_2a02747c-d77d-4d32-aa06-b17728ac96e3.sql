ALTER TABLE public.paket_tryout 
ADD COLUMN max_attempts INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.paket_tryout.max_attempts IS 'Maximum number of attempts allowed per user. 0 = unlimited.';