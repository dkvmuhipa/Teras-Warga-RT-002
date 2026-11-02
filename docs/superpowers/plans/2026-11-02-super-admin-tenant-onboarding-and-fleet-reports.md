# Super Admin Tenant Onboarding & Fleet Reports Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan kapabilitas pendaftaran massal RT (*Bulk Onboarding* via Generator Rentang & Template Excel), Ekspor Laporan Rekapitulasi Wilayah Multi-Sheet (.xlsx) untuk Kelurahan, serta Replikasi Template Konfigurasi Wilayah.

---

### File Architecture & Boundaries

| File | Peran & Tanggung Jawab |
| :--- | :--- |
| [`services/excelService.ts`](file:///d:/GELLONA/PROJECT/Teras-Warga-RT-002/services/excelService.ts) | Menambahkan `exportFleetReportExcel`, `generateBulkTenantTemplateExcel`, dan `parseBulkTenantExcel`. |
| [`components/superadmin/BulkTenantOnboardModal.tsx`](file:///d:/GELLONA/PROJECT/Teras-Warga-RT-002/components/superadmin/BulkTenantOnboardModal.tsx) | Komponen modal baru untuk onboarding massal (Mode Generator Rentang RT & Mode Import Excel). |
| [`components/superadmin/SuperAdminPortal.tsx`](file:///d:/GELLONA/PROJECT/Teras-Warga-RT-002/components/superadmin/SuperAdminPortal.tsx) | Integrasi tombol pendaftaran massal, ekspor laporan kelurahan .xlsx, dan state modal. |
| [`components/superadmin/TenantDetailModal.tsx`](file:///d:/GELLONA/PROJECT/Teras-Warga-RT-002/components/superadmin/TenantDetailModal.tsx) | Fitur replikasi konfigurasi modul & tarif dari RT acuan (RT 002) ke tenant terpilih. |

---

### Tasks

#### Task 1: Fitur Excel Laporan Wilayah & Parser Template di `excelService.ts`
- [ ] Buat fungsi `exportFleetReportExcel` menggunakan `exceljs` yang menghasilkan workbook ber-kop dengan 3 sheet:
  - Sheet 1: Direktori RT & Profil Wilayah (RT, RW, Kelurahan, Ketua RT, No WA, Status, Jumlah Rumah).
  - Sheet 2: Kesehatan Finansial & Kas RT (Saldo kas per RT, total masuk, total keluar, tarif retribusi).
  - Sheet 3: Rekapitulasi PBB & Sanitasi STBM (Persentase lunas SPPT PBB, jumlah jamban sehat).
- [ ] Buat fungsi `generateBulkTenantTemplateExcel` untuk mengunduh template spreadsheet resmi pendaftaran massal RT.
- [ ] Buat fungsi `parseBulkTenantExcel` untuk membaca berkas `.xlsx` hasil unggahan pengguna dan mengonversinya menjadi daftar kandidat RT tervalidasi.
- [ ] Verifikasi dengan pengujian build & static typing (`tsc --noEmit`).

#### Task 2: Pembuatan Komponen Modal `BulkTenantOnboardModal.tsx`
- [ ] Buat modal onboarding dengan 2 tab:
  - Tab 1: **Generator Rentang RT** (Form input: Kelurahan, RW, RT Awal, RT Akhir, Format Blok Rumah, Password Default).
  - Tab 2: **Import Excel / CSV** (Dropzone unggah file, tombol unduh template, dan tabel preview validasi).
- [ ] Tambahkan verifikasi slug & deteksi duplikasi sebelum eksekusi.
- [ ] Terapkan eksekusi batch berprogres (*progress bar*) yang memanggil `createTenant` dan menambahkan profil ketua RT ke Firestore.
- [ ] Pastikan styling konsisten dengan palet warm Teras Warga dan accessibility Escape/Close modal.

#### Task 3: Integrasi ke `SuperAdminPortal.tsx`
- [ ] Tambahkan tombol "Onboarding Massal RT" di samping "Daftarkan RT Baru".
- [ ] Tambahkan tombol "Ekspor Rekapitulasi Kelurahan (.xlsx)" di samping "Cadangkan Snapshot Platform (JSON)".
- [ ] Hubungkan modal `BulkTenantOnboardModal` dengan state dan callback audit log.
- [ ] Hubungkan aksi ekspor Excel dengan data agregat `availableTenants`, `allHouses`, `allCashFlow`, dan `allOfficials`.

#### Task 4: Fitur Replikasi Konfigurasi di `TenantDetailModal.tsx`
- [ ] Tambahkan aksi "Terapkan Standar Konfigurasi RT 002" di tab Operations `TenantDetailModal.tsx`.
- [ ] Salin konfigurasi modul aktif (`modules`), besaran iuran default (`fees`), dan template persuratan ke tenant target secara instan.

#### Task 5: Strict Verification & Deployment
- [ ] Jalankan `npx tsc --noEmit` untuk memastikan 0 error tipe TypeScript.
- [ ] Jalankan `npm run build` untuk memverifikasi proses build Vite sukses.
- [ ] Commit dan push ke `main` dan verifikasi deployment Vercel Production.
