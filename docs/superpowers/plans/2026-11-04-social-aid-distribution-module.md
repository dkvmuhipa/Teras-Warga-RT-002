# Social Aid & Distribution Module (Penyaluran Bantuan Sosial) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dedicated, comprehensive Social Aid & Welfare Distribution module (`SocialAidManager`) in Admin RT for managing social assistance batches (beras Bulog, sembako, BLT, CSR), tracking recipient handovers with digital checklists, sending WhatsApp pickup reminders, and generating official handover PDF reports.

**Architecture:** 
- TypeScript data models for `SocialAidItem` & `SocialAidRecipient` in `types.ts`.
- Firestore CRUD & real-time listener methods in `services/databaseService.ts` (`social_aid` collection).
- Official PDF handover certificate & recipient attendance report in `services/pdfService.ts`.
- Dedicated rich interactive manager component `components/admin/SocialAidManager.tsx`.
- Integrated directly into `AdminDashboard.tsx` sidebar navigation as dedicated menu `bansos`.
- Linked in `DashboardOverview.tsx` secondary services accordion.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Lucide Icons, jsPDF / autotable, Sonner toasts.

---

## Global Constraints
- Preserve warm community-focused palette (amber/orange accents, clean category pastel cards, dark navy/indigo widgets, `font-mono tabular-nums`). Zero slop.
- Maintain natural alphanumeric sorting for house numbers (C5–C12).
- Zero build errors on `npm.cmd run build`.

---

## Tasks

- [ ] **Task 1: Data Models & Types**
  - Add `SocialAidItem` and `SocialAidRecipient` interfaces to `types.ts`.
  - Add `socialAid?: SocialAidItem[]` to relevant container types if needed.

- [ ] **Task 2: Database Services for Social Aid**
  - Add `SOCIAL_AID_COL = "social_aid"` constant in `services/databaseService.ts`.
  - Implement `subscribeToSocialAid(callback)`, `addSocialAidToDb(data)`, `updateSocialAidInDb(id, updates)`, `deleteSocialAidFromDb(id)`.
  - Implement `toggleRecipientReceiptStatus(aidId, houseId, isReceived, receivedBy)`.

- [ ] **Task 3: Official PDF Handover Certificate in pdfService**
  - Create `generateSocialAidHandoverPDF(aid: SocialAidItem, config: PdfConfig)` in `services/pdfService.ts`.
  - Render standard RT 002 official letterhead (Kop Surat), distribution summary, recipient signature sheet, and sign-off blocks.

- [ ] **Task 4: SocialAidManager Component**
  - Create `components/admin/SocialAidManager.tsx`.
  - Feature 1: Metric summary banner (Total Program, Total Kuota Diterima, Paket Tersalurkan, Sisa Paket).
  - Feature 2: Batch program creator modal (Judul, Kategori, Sumber Bantuan, Tanggal, Kuota, Unit).
  - Feature 3: Smart recipient picker (Auto-recommend Pra-Sejahtera & PKH/BLT/BPNT, or multi-select kavling per Blok C5-C12).
  - Feature 4: Interactive receipt checklist (Tandai Diterima, catat nama penerima/pengambil, timestamp).
  - Feature 5: WhatsApp pickup notification using `openWhatsApp`.
  - Feature 6: PDF handover certificate export & CSV export.

- [ ] **Task 5: AdminDashboard & Overview Integration (OPSI A)**
  - Register `bansos` in `AdminDashboard.tsx` (`navItemsList`, `allowedItems`, lazy import, route handling).
  - Add quick action / pill in `DashboardOverview.tsx` for easy access.

- [ ] **Task 6: Verification & Production Deployment**
  - Run `npm.cmd run build` to verify 0 TypeScript/bundling errors.
  - Commit and push to `main`.
  - Verify production live status.
