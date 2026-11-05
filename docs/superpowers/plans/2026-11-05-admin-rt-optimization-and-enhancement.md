# Admin RT Optimization & Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menyederhanakan redundansi navigasi dan meningkatkan kapabilitas operasional cerdas pada Portal Admin RT 02 melalui eksekusi terpadu 4 item penyederhanaan (A1–A4) dan 3 item pengembangan (B1–B3).

**Architecture:** 
1. **Navigasi & Isolasi Modul (A1–A4):** Menyatukan alur kerja yang relevan pada pintu masuk tunggal (Aduan Warga & Tamu Wajib, Agenda Warga & Kerja Bakti, Ronda & SOS Darurat), serta mengisolasi sub-modul kependudukan (`mutations`, `health`, `officials`) agar tampil bersih tanpa kontainer filter warga yang redundan.
2. **Integrasi Cerdas Lintas Modul (B1–B3):** Menambahkan indikator & filter prioritas Bansos berbasis riwayat dan demografi keluarga, mengaktifkan sinkronisasi otomatis kontrak sewa rumah ke status warga, serta menyambungkan pencatatan/pelunasan meteran air ke pembukuan Kas & Iuran.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Motion React (`motion/react`), Lucide React, Firebase Firestore.

---

### Task 1: [A1] Dedikasi & Integrasi Portal "Aduan & Tamu Wajib" (`reports-warga`)
- **Tujuan:** Menjadikan rute `reports-warga` sebagai pusat kendali terpadu untuk Aduan Warga dan Log Wajib Lapor Tamu 1×24 Jam (mengintegrasikan `GuestManager`), serta merapikan `ServiceManager` agar fokus pada tata kelola persuratan RT.
- **Files to modify:**
  - `components/admin/AdminDashboard.tsx`: Saat `activeTab === 'reports-warga'`, tampilkan wrapper tab terpadu: Tab 1 "Aspirasi & Aduan Warga" (dengan filter status laporan dan integrasi AI), Tab 2 "Wajib Lapor Tamu 1×24 Jam" (`GuestManager`).
- **Verifikasi:** Klik menu "Aduan Warga & Tamu" di Sidebar langsung menampilkan kedua tab dengan badge jumlah tertunda yang akurat.

---

### Task 2: [A2] Integrasi Terpadu "Agenda Kegiatan & Kerja Bakti" (`activities` & `kerja-bakti`)
- **Tujuan:** Mengonsolidasikan agenda musyawarah/kegiatan warga (`ActivityManagement`) dan agenda gotong royong kerja bakti (`CommunityWorkManager`) ke dalam satu antarmuka yang terintegrasi.
- **Files to modify:**
  - `components/admin/ActivityManagement.tsx` atau `components/admin/AdminDashboard.tsx`: Menyediakan navigasi sub-tab yang elegan antara "Agenda Pertemuan & Presensi" dan "Kerja Bakti & Gotong Royong", sehingga pengurus tidak perlu berpindah-pindah menu yang terpecah.
  - `components/admin/Sidebar.tsx`: Menandai status aktif yang konsisten.
- **Verifikasi:** Berpindah antara agenda rapat warga dan kerja bakti dapat dilakukan dalam satu klik tanpa kehilangan konteks.

---

### Task 3: [A3] Konsolidasi Keamanan: Integrasi Log Darurat SOS ke dalam "Ronda & Keamanan" (`facilities`)
- **Tujuan:** Menyatukan pantauan siskamling, jadwal ronda, presensi satpam/warga, dan riwayat panggilan darurat SOS (`PanicAlertLogs`) di bawah menu utama "Ronda & Keamanan".
- **Files to modify:**
  - `components/admin/FacilityManager.tsx`: Tambahkan tab "Log & Riwayat SOS Darurat" yang merender riwayat panic button dengan filter status/tanggal dan tombol tindak lanjut.
  - `components/admin/AdminDashboard.tsx`: Arahkan rute `panic-logs` ke `FacilityManager` dengan sub-tab darurat otomatis terbuka.
- **Verifikasi:** Tidak ada redundansi menu darurat; tombol darurat di overview atau sidebar langsung membuka tab riwayat SOS di pusat keamanan.

---

### Task 4: [A4] Isolasi Tampilan Bersih untuk Sub-Modul Kependudukan (`mutations`, `health`, `officials`)
- **Tujuan:** Menghilangkan bilah filter pencarian rumah, switch grid/tabel/peta, dan statistik rumah tangga saat admin secara spesifik membuka menu **Mutasi Penduduk**, **Data Kesehatan Warga**, atau **Susunan Pengurus RT**.
- **Files to modify:**
  - `components/admin/ResidentManager.tsx`: Deteksi mode tampilan mandiri (`isStandaloneSubModule = ['mutations', 'health', 'officials'].includes(viewMode)`). Sembunyikan `ResidentStats` dan `ResidentControls` yang tidak relevan saat sub-modul tersebut aktif, sehingga antarmuka fokus 100% pada data modul tersebut.
- **Verifikasi:** Membuka menu Mutasi Penduduk langsung menyajikan tabel mutasi tanpa terdorong oleh filter pencarian warga di atasnya.

---

### Task 5: [B1] Indikator & Filter Prioritas Cerdas pada Penyaluran Bantuan (`SocialAidManager.tsx`)
- **Tujuan:** Membantu Ketua RT dan pengurus membagi bantuan/sembako murah secara adil dan tepat sasaran.
- **Files to modify:**
  - `components/admin/SocialAidManager.tsx`:
    - Hitung usia anggota keluarga untuk mendeteksi keberadaan **Lansia (≥ 60 th)** dan **Balita (≤ 5 th)** pada setiap rumah.
    - Hitung frekuensi riwayat penerimaan bantuan tahun berjalan (`aidHistoryCount`).
    - Tambahkan filter cepat pada daftar checklist penerima: "Semua", "Prioritas Lansia & Balita", "Belum Pernah Menerima Bantuan", "Bansos Pemerintah (PKH/BLT/BPNT)".
    - Tampilkan lencana visual informatif pada kartu rumah (`👴 Lansia`, `👶 Balita`, `🟢 0x Bantuan` vs `🟡 1x Bantuan`).
- **Verifikasi:** Saat membuat program sembako/bantuan baru, admin dapat mengklik tombol "Prioritas Lansia & Balita" atau "Belum Pernah Menerima" untuk menyaring target penerima secara instan.

---

### Task 6: [B2] Sinkronisasi Otomatis Rumah Sewa/Kontrakan (`RentalManager.tsx`) ↔ Data Warga (`houses`)
- **Tujuan:** Mencegah ketidaksinkronan antara buku kontrak sewa dan buku induk kependudukan RT 02.
- **Files to modify:**
  - `components/admin/RentalManager.tsx`:
    - Tambahkan tombol aksi cepat *"🔄 Sinkron ke Data Warga"* pada setiap kartu kontrak aktif.
    - Pastikan saat disinkronkan, status rumah diperbarui menjadi `residenceType: 'Kontrak'`, nama penyewa menjadi Kepala Keluarga sementara, dan `ownerName` tetap terjaga sesuai nama pemilik di SK.
    - Saat kontrak ditandai `Selesai` atau `Kosong`, sediakan opsi instan untuk mengosongkan status hunian rumah di data kependudukan.
- **Verifikasi:** Menambah atau memperbarui kontrak kontrakan langsung mengalirkan data ke tabel Data Warga tanpa penginputan ulang.

---

### Task 7: [B3] Sinkronisasi Tagihan & Pembayaran Air (`WaterMeterManager.tsx`) ↔ Pembukuan Kas & Iuran
- **Tujuan:** Menghubungkan verifikasi meteran air langsung dengan pencatatan pelunasan iuran warga (`iuranPayments`) dan arus kas masuk (`cashFlow`).
- **Files to modify:**
  - `types.ts`: Tambahkan kolom status pembayaran air pada `WaterMeterReading` (`paymentStatus?: 'Lunas' | 'Belum Lunas'`, `paidAt?: string`).
  - `components/admin/WaterMeterManager.tsx`:
    - Pada aksi verifikasi atau kartu tagihan meteran, sediakan opsi *"Tandai Lunas & Catat ke Kas/Iuran"*.
    - Otomatis mencatat mutasi kas masuk kategori `Iuran Air` dan log pembayaran ke `iuranPayments` secara real-time.
- **Verifikasi:** Meteran air yang diverifikasi lunas langsung muncul di tabel penerimaan kas RT dan kartu iuran warga yang bersangkutan.

---

### Task 8: Verifikasi Komprehensif, Build & Deployment Produksi
- **Langkah:**
  1. Jalankan `npm run build` untuk memverifikasi nol error TypeScript dan Vite bundler.
  2. Commit perubahan terstruktur ke git.
  3. Push ke branch `main` untuk auto-deploy ke Vercel production.
  4. Lakukan verifikasi deployment di `https://terasrt02.vercel.app`.
