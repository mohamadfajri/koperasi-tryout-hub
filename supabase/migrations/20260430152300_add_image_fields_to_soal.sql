ALTER TABLE public.soal
ADD COLUMN pertanyaan_gambar_url TEXT,
ADD COLUMN opsi_a_gambar_url TEXT,
ADD COLUMN opsi_b_gambar_url TEXT,
ADD COLUMN opsi_c_gambar_url TEXT,
ADD COLUMN opsi_d_gambar_url TEXT,
ADD COLUMN opsi_e_gambar_url TEXT,
ADD COLUMN pembahasan_gambar_url TEXT;

COMMENT ON COLUMN public.soal.pertanyaan_gambar_url IS 'URL gambar untuk isi pertanyaan';
COMMENT ON COLUMN public.soal.opsi_a_gambar_url IS 'URL gambar untuk opsi A';
COMMENT ON COLUMN public.soal.opsi_b_gambar_url IS 'URL gambar untuk opsi B';
COMMENT ON COLUMN public.soal.opsi_c_gambar_url IS 'URL gambar untuk opsi C';
COMMENT ON COLUMN public.soal.opsi_d_gambar_url IS 'URL gambar untuk opsi D';
COMMENT ON COLUMN public.soal.opsi_e_gambar_url IS 'URL gambar untuk opsi E';
COMMENT ON COLUMN public.soal.pembahasan_gambar_url IS 'URL gambar untuk pembahasan soal';
