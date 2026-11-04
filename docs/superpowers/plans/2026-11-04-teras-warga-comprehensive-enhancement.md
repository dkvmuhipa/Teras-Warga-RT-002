# Comprehensive Teras Warga Enhancement Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade and audit four core modules of Teras Warga RT 02: (1) Resident Self-Service Dashboard & Letters, (2) Finance Manager & Chronological Analytics, (3) WhatsApp Broadcast with Live Message Preview, and (4) PWA Mobile Experience & Offline Resilience.

**Architecture:** Refactor modular React components with strict adherence to WCAG 2.2 AA accessibility, centralized WhatsApp service helpers, accurate chronological data sorting, and high-contrast, slop-free UI styling.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Lucide React, Recharts, Vite PWA, Firebase Auth & Firestore.

## Global Constraints

- Preserve warm, community-focused palette (amber/orange accents, clean pastel category cards, dark navy/indigo widgets, tabular figures `font-mono tabular-nums`).
- Avoid slop (no aggressive blinking `animate-ping`, no unnecessary bouncy animations `animate-bounce`, no unoptimized blur blobs).
- Natural alphanumeric sorting for house numbers and RT block codes.
- `npm run build` must compile with 0 errors before each commit and push to `main`.

---

### Task 1: Resident Self-Service Dashboard & Letters Audit

**Files:**
- Modify: `components/public/dashboard/tabs/ResidentLettersTab.tsx`
- Modify: `components/public/dashboard/ResidentHeader.tsx`

- [x] **Step 1.1:** Replace hardcoded WhatsApp URL `https://wa.me/6285961194621` in `ResidentLettersTab.tsx` with centralized `openWhatsApp` from `services/whatsappService.ts`.
- [x] **Step 1.2:** Standardize RT naming copy to use `RT_NAME` (`RT 02`).
- [x] **Step 1.3:** Remove stray whitespace and ensure timeline step badges have crisp contrast without unstyled classes.
- [x] **Step 1.4:** Verify `npm run build` succeeds with 0 errors.

---

### Task 2: Financial Manager Chronological Sorting & Number Formatting

**Files:**
- Modify: `components/admin/FinanceManager.tsx`

- [x] **Step 2.1:** Fix placeholder `return 0;` sort in `chartData` (lines 115-117) by implementing proper date parsing (`year * 100 + month`) so the last 6 months are strictly chronological.
- [x] **Step 2.2:** Ensure tabular figures (`font-mono tabular-nums`) on all currency metrics (Total Pemasukan, Total Pengeluaran, Saldo Kas).
- [x] **Step 2.3:** Verify `npm run build` succeeds with 0 errors.

---

### Task 3: WhatsApp Broadcast with Live Message Preview

**Files:**
- Modify: `components/admin/AnnouncementManagement.tsx`

- [x] **Step 3.1:** Compute the formatted WhatsApp message inside `AnnouncementManagement.tsx` when an announcement is selected for broadcast.
- [x] **Step 3.2:** Add a clean preview accordion/card inside `isBroadcastModalOpen` showing exact WhatsApp formatted output.
- [x] **Step 3.3:** Add a 1-click "Salin Pesan" button allowing the admin to copy the text to clipboard directly.
- [x] **Step 3.4:** Verify `npm run build` succeeds with 0 errors.

---

### Task 4: PWA Mobile Offline & Install Experience

**Files:**
- Modify: `components/PWAStatusHandler.tsx`
- Modify: `components/PWAInstallPrompt.tsx`

- [x] **Step 4.1:** Adjust z-index of offline sticky banner to `z-[120]` so it floats cleanly above header banners without layout overlap.
- [x] **Step 4.2:** Ensure install prompt modal respects brand palette with accessible touch targets $\ge 44\text{px}$.
- [x] **Step 4.3:** Run full production build `npm run build` and verify 0 errors.
- [x] **Step 4.4:** Commit and push changes to `origin main`, then verify Vercel production deployment.
