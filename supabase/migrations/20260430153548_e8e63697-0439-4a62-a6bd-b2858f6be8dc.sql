
ALTER TABLE public.soal
  ADD COLUMN IF NOT EXISTS pertanyaan_gambar TEXT,
  ADD COLUMN IF NOT EXISTS opsi_a_gambar TEXT,
  ADD COLUMN IF NOT EXISTS opsi_b_gambar TEXT,
  ADD COLUMN IF NOT EXISTS opsi_c_gambar TEXT,
  ADD COLUMN IF NOT EXISTS opsi_d_gambar TEXT,
  ADD COLUMN IF NOT EXISTS opsi_e_gambar TEXT,
  ADD COLUMN IF NOT EXISTS pembahasan_gambar TEXT;

INSERT INTO storage.buckets (id, name, public)
VALUES ('soal-images', 'soal-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "soal-images public read" ON storage.objects;
CREATE POLICY "soal-images public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'soal-images');

DROP POLICY IF EXISTS "soal-images admin insert" ON storage.objects;
CREATE POLICY "soal-images admin insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'soal-images' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "soal-images admin update" ON storage.objects;
CREATE POLICY "soal-images admin update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'soal-images' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "soal-images admin delete" ON storage.objects;
CREATE POLICY "soal-images admin delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'soal-images' AND public.has_role(auth.uid(), 'admin'));
