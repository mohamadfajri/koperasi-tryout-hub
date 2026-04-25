
-- Fix function search_path
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- Seed: paket gratis demo
INSERT INTO public.paket_tryout (id, judul, deskripsi, harga, durasi_menit, jumlah_soal, is_gratis, is_aktif)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Tryout Gratis: Pengenalan Koperasi Desa Merah Putih',
  'Paket demo gratis berisi 5 soal pengenalan tentang Koperasi Desa Merah Putih. Cocok untuk mencoba platform.',
  0, 15, 5, true, true
);

-- Paket premium contoh
INSERT INTO public.paket_tryout (judul, deskripsi, harga, durasi_menit, jumlah_soal, is_gratis, is_aktif)
VALUES (
  'Paket Premium: Tryout Lengkap Koperasi Desa',
  'Latihan lengkap materi UU Koperasi, Manajemen Koperasi Desa, dan Akuntansi Koperasi. 50 soal dalam 90 menit.',
  75000, 90, 50, false, true
);

-- 5 soal sampel untuk paket gratis
INSERT INTO public.soal (paket_id, nomor, pertanyaan, opsi_a, opsi_b, opsi_c, opsi_d, opsi_e, jawaban_benar, pembahasan) VALUES
('11111111-1111-1111-1111-111111111111', 1,
 'Apa kepanjangan dari "Koperasi Desa Merah Putih"?',
 'Koperasi Desa Mandiri Republik Putih',
 'Koperasi Desa yang berasaskan kebersamaan dan nasionalisme',
 'Koperasi Daerah Merah Putih',
 'Koperasi Desa Mitra Pembangunan',
 'Koperasi Desa Multi Pelayanan',
 'B',
 'Koperasi Desa Merah Putih adalah inisiatif koperasi tingkat desa yang berlandaskan semangat kebersamaan dan kebangsaan.'),
('11111111-1111-1111-1111-111111111111', 2,
 'Asas yang mendasari koperasi di Indonesia adalah?',
 'Individualisme', 'Kekeluargaan', 'Kapitalisme', 'Liberalisme', 'Sosialisme',
 'B',
 'Berdasarkan UU No. 25 Tahun 1992, koperasi berasaskan kekeluargaan.'),
('11111111-1111-1111-1111-111111111111', 3,
 'Siapa yang dijuluki Bapak Koperasi Indonesia?',
 'Soekarno', 'Hatta', 'Soepomo', 'Tan Malaka', 'Sjahrir',
 'B',
 'Mohammad Hatta dijuluki sebagai Bapak Koperasi Indonesia.'),
('11111111-1111-1111-1111-111111111111', 4,
 'SHU dalam koperasi adalah singkatan dari?',
 'Sisa Hasil Usaha', 'Sumber Hasil Usaha', 'Sistem Hasil Usaha', 'Saham Hasil Usaha', 'Skema Hasil Usaha',
 'A',
 'SHU = Sisa Hasil Usaha, yaitu pendapatan koperasi setelah dikurangi biaya operasional dan kewajiban.'),
('11111111-1111-1111-1111-111111111111', 5,
 'Kekuasaan tertinggi dalam koperasi berada pada?',
 'Pengurus', 'Pengawas', 'Manajer', 'Rapat Anggota', 'Ketua Umum',
 'D',
 'Berdasarkan UU Koperasi, Rapat Anggota adalah pemegang kekuasaan tertinggi.');
