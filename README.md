<div align="center">
  <img width="96" height="96" alt="Logo Kota Palu - Teras Warga RT 002" src="https://upload.wikimedia.org/wikipedia/commons/e/e5/Lambang_Kota_Palu.png" />
  <h1>TERAS WARGA RT 002 / RW 020</h1>
  <p><strong>Sistem Informasi Pelayanan, Administrasi Kependudukan, Keamanan & Ketangguhan Lingkungan</strong></p>
  <p>Kawasan Hunian Tetap (Huntap) Tondo 2 • Kelurahan Tondo, Kecamatan Mantikulore, Kota Palu, Sulawesi Tengah</p>
  <p>
    <a href="https://terasrt02.vercel.app"><strong>🌐 Portal Produksi (terasrt02.vercel.app)</strong></a> •
    <a href="https://terasrt02.vercel.app/#/services"><strong>📝 Layanan Surat Online</strong></a> •
    <a href="https://terasrt02.vercel.app/#/info"><strong>📊 Transparansi Kas & Wilayah</strong></a> •
    <a href="https://terasrt02.vercel.app/#/earthquake"><strong>🚨 Pantauan Gempa & Cuaca BMKG</strong></a>
  </p>
</div>

---

## 📌 Ringkasan Platform

**Teras Warga RT 002** (**T**ransparan, **E**fektif, **R**amah, **A**man, **S**olusi) adalah platform *Smart Community* berbasis web progresif (PWA) yang dirancang khusus untuk melayani warga dan pengurus **RT 002 / RW 020 Huntap Tondo 2, Kota Palu**.

### Fitur Utama Portal Publik & Warga
- **Layanan Persuratan & Pengaduan Mandiri (`/#/services`):** Pengajuan surat pengantar RT (KTP, KK, Domisili, SKTM, Usaha, Kematian, dll.) lengkap dengan verifikasi tanda tangan elektronik ber-QR Code dan lacak status pengajuan.
- **Verifikasi Keaslian Dokumen (`/#/verify` & `/#/download-surat`):** Pemindaian dan validasi surat pengantar resmi RT 002 secara *real-time*.
- **Transparansi Kas & Demografi Wilayah (`/#/info`):** Ringkasan pemasukan/pengeluaran kas RT, sebaran blok hunian (Blok C5 s.d. C12), dan pengumuman resmi pengurus.
- **Peta Blok & Direktori Hunian (`/#/map`):** Peta tata letak kavling warga, fasilitas umum, pos ronda, dan jalur evakuasi.
- **Mitigasi Bencana & Pantauan BMKG (`/#/earthquake`):** Data gempa terkini BMKG, cuaca mikro Tondo/Mantikulore, titik kumpul evakuasi, dan *Utility Outage Tracker* (laporan gangguan air/listrik).
- **Ekonomi & Lingkungan Warga:** Direktori UMKM Warga (`/#/umkm`), Bank Sampah Terpadu (`/#/waste`), Posyandu & Kesehatan (`/#/health`), Donasi Warga (`/#/donations`), serta Buku Saku & Peraturan RT 002 (`/#/rules`, `/#/welcome-kit`).
- **Dasbor Khusus Warga (`/#/resident`):** Kartu Keluarga Digital (E-ID), riwayat iuran bulanan (Air & Sampah), jadwal ronda siskamling, dan buku tamu menginap.

### Fitur Dasbor Pengurus (Admin RT, Master RW/Kelurahan, SuperAdmin)
- **Manajemen Kependudukan & Mutasi:** Direktori KK per blok dengan pengurutan alfanumerik natural (`C5-1` s.d. `C12-20`), pencatatan mutasi warga (lahir, wafat, pindah, datang), serta ekspor PDF ber-Kop Resmi & Excel (`.xlsx`).
- **Manajemen Iuran, Keuangan & LPJ:** Pencatatan iuran bulanan tunai, kuitansi PDF resmi, arus kas, laporan bulanan terpadu, dan Laporan Pertanggungjawaban (LPJ) tahunan.
- **Modul Pendataan Khusus:** Sanitasi Total Berbasis Masyarakat (**5 Pilar STBM**), pendataan **SPPT PBB**, **Meteran Air / PDAM**, dan **Distribusi Bantuan Sosial (Bansos)**.

---

## 🛠️ Teknologi Utama

- **Frontend:** React 19, TypeScript, Vite 6, Tailwind CSS, Framer Motion, Lucide Icons, Recharts.
- **Backend & Database:** Firebase Authentication, Cloud Firestore (Real-time Sync + Offline Persistence + Multi-Tenant Isolation), Express Server (`server.ts`).
- **Dokumen & Laporan:** `jsPDF` + `jspdf-autotable` (Surat & Laporan PDF Resmi), `ExcelJS` (Ekspor/Impor Spreadsheet Multi-Sheet), `qrcode`.
- **AI & Integrasi Eksternal:** Google Gemini API (`@google/genai` untuk asisten warga & analisis), BMKG Terbuka & Open-Meteo API.

---

## 🚀 Menjalankan Secara Lokal

### Prasyarat
- **Node.js** v18+ dan `npm`

### Langkah Instalasi
1. **Instal dependensi:**
   ```bash
   npm install
   ```
2. **Konfigurasi Environment Variables (`.env.local`):**
   Buat berkas `.env.local` di direktori utama dan sesuaikan variabel berikut:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
   ```
3. **Jalankan server pengembangan:**
   ```bash
   npm run dev
   ```
   Aplikasi dapat diakses pada `http://localhost:3000`.

---

## 📦 Pemeriksaan Kualitas & Build Produksi

- **Pemeriksaan Tipe TypeScript (Static Analysis):**
  ```bash
  npm run lint
  ```
- **Build Produksi (Vite SPA Bundle):**
  ```bash
  npm run build
  ```
- **Deploy Aturan Keamanan Firestore:**
  ```bash
  npx firebase-tools deploy --only firestore:rules
  ```

---

## 📍 Informasi Sekretariat RT 002

- **Alamat:** Jl. Pue Lombe Blok C10 No. 8, Kawasan Hunian Tetap (Huntap) Tondo 2, RT 002 / RW 020, Kelurahan Tondo, Kecamatan Mantikulore, Kota Palu, Sulawesi Tengah 94119.
- **Ketua RT 002:** Bpk. Irfan Arianto (`+62 859-6119-4621`)
