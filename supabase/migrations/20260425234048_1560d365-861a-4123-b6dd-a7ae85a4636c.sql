
-- =========================
-- ENUMS
-- =========================
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.payment_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.session_status AS ENUM ('in_progress', 'completed', 'abandoned');

-- =========================
-- PROFILES
-- =========================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =========================
-- USER ROLES
-- =========================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role function (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- =========================
-- PAKET TRYOUT
-- =========================
CREATE TABLE public.paket_tryout (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  judul TEXT NOT NULL,
  deskripsi TEXT,
  harga INTEGER NOT NULL DEFAULT 0,
  durasi_menit INTEGER NOT NULL DEFAULT 90,
  jumlah_soal INTEGER NOT NULL DEFAULT 50,
  is_gratis BOOLEAN NOT NULL DEFAULT false,
  is_aktif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.paket_tryout ENABLE ROW LEVEL SECURITY;

-- =========================
-- SOAL
-- =========================
CREATE TABLE public.soal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paket_id UUID NOT NULL REFERENCES public.paket_tryout(id) ON DELETE CASCADE,
  nomor INTEGER NOT NULL,
  pertanyaan TEXT NOT NULL,
  opsi_a TEXT NOT NULL,
  opsi_b TEXT NOT NULL,
  opsi_c TEXT NOT NULL,
  opsi_d TEXT NOT NULL,
  opsi_e TEXT,
  jawaban_benar TEXT NOT NULL CHECK (jawaban_benar IN ('A','B','C','D','E')),
  pembahasan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.soal ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_soal_paket ON public.soal(paket_id);

-- =========================
-- PEMBAYARAN
-- =========================
CREATE TABLE public.pembayaran (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paket_id UUID NOT NULL REFERENCES public.paket_tryout(id) ON DELETE CASCADE,
  nominal INTEGER NOT NULL,
  bukti_url TEXT,
  status payment_status NOT NULL DEFAULT 'pending',
  catatan_admin TEXT,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pembayaran ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_pembayaran_user ON public.pembayaran(user_id);
CREATE INDEX idx_pembayaran_status ON public.pembayaran(status);

-- helper: cek apakah user sudah bayar (approved) untuk paket
CREATE OR REPLACE FUNCTION public.has_paid_access(_user_id UUID, _paket_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.pembayaran
    WHERE user_id = _user_id AND paket_id = _paket_id AND status = 'approved'
  ) OR EXISTS (
    SELECT 1 FROM public.paket_tryout WHERE id = _paket_id AND is_gratis = true
  );
$$;

-- =========================
-- SESI TRYOUT
-- =========================
CREATE TABLE public.sesi_tryout (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paket_id UUID NOT NULL REFERENCES public.paket_tryout(id) ON DELETE CASCADE,
  waktu_mulai TIMESTAMPTZ NOT NULL DEFAULT now(),
  waktu_selesai TIMESTAMPTZ,
  skor INTEGER,
  jumlah_benar INTEGER,
  jumlah_salah INTEGER,
  status session_status NOT NULL DEFAULT 'in_progress',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sesi_tryout ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_sesi_user ON public.sesi_tryout(user_id);

-- =========================
-- JAWABAN USER
-- =========================
CREATE TABLE public.jawaban_user (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sesi_id UUID NOT NULL REFERENCES public.sesi_tryout(id) ON DELETE CASCADE,
  soal_id UUID NOT NULL REFERENCES public.soal(id) ON DELETE CASCADE,
  jawaban TEXT CHECK (jawaban IN ('A','B','C','D','E')),
  is_benar BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(sesi_id, soal_id)
);
ALTER TABLE public.jawaban_user ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_jawaban_sesi ON public.jawaban_user(sesi_id);

-- =========================
-- RLS POLICIES
-- =========================

-- profiles
CREATE POLICY "users view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- user_roles
CREATE POLICY "users view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- paket_tryout
CREATE POLICY "everyone view active paket" ON public.paket_tryout
  FOR SELECT USING (is_aktif = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin manage paket" ON public.paket_tryout
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- soal: hanya user yg punya akses paket atau admin
CREATE POLICY "view soal with access" ON public.soal
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_paid_access(auth.uid(), paket_id)
  );
CREATE POLICY "admin manage soal" ON public.soal
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- pembayaran
CREATE POLICY "users view own pembayaran" ON public.pembayaran
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "users create own pembayaran" ON public.pembayaran
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own pending pembayaran" ON public.pembayaran
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "admin manage pembayaran" ON public.pembayaran
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- sesi_tryout
CREATE POLICY "users view own sesi" ON public.sesi_tryout
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "users create own sesi" ON public.sesi_tryout
  FOR INSERT WITH CHECK (auth.uid() = user_id AND public.has_paid_access(auth.uid(), paket_id));
CREATE POLICY "users update own sesi" ON public.sesi_tryout
  FOR UPDATE USING (auth.uid() = user_id);

-- jawaban_user
CREATE POLICY "users view own jawaban" ON public.jawaban_user
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.sesi_tryout s WHERE s.id = sesi_id AND (s.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
  );
CREATE POLICY "users insert own jawaban" ON public.jawaban_user
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.sesi_tryout s WHERE s.id = sesi_id AND s.user_id = auth.uid())
  );
CREATE POLICY "users update own jawaban" ON public.jawaban_user
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.sesi_tryout s WHERE s.id = sesi_id AND s.user_id = auth.uid())
  );

-- =========================
-- TRIGGERS
-- =========================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INTEGER;
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );

  SELECT COUNT(*) INTO user_count FROM auth.users;
  IF user_count = 1 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER tr_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER tr_paket_updated BEFORE UPDATE ON public.paket_tryout
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER tr_pembayaran_updated BEFORE UPDATE ON public.pembayaran
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========================
-- STORAGE BUCKET for payment proofs
-- =========================
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "users upload own payment proof"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'payment-proofs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "users view own payment proof"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'payment-proofs'
  AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin'))
);

CREATE POLICY "admin view all payment proofs"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-proofs' AND public.has_role(auth.uid(), 'admin'));
