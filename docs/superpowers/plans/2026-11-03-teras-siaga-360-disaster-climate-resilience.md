# Teras Siaga 360 (Smart Analysis for Disaster, Climate Adaptation & Resilience) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build "Teras Siaga 360", a hyper-local micro-GIS and AI resilience system inspired by Pemkot Samarinda's SADAR, tailored specifically for the post-disaster community of Huntap Tondo 2, Palu (RT 002 / RW 020).

**Architecture:** Combine micro-GIS vector mapping of Huntap Tondo 2 kavling blocks with resident vulnerability data (elderly, infants, pregnant mothers) and real-time environmental feeds (BMKG Palu-Koro seismic distance, Palu temperature & ISPU AQI air quality). Provide an AI predictive advisory engine (Gemini AI with deterministic local fallback) and an interactive evacuation route simulator for residents and volunteers.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Lucide Icons, Motion (motion/react), Web Audio API, Gemini AI REST API, BMKG seismic hooks.

**Spec:** [docs/superpowers/plans/2026-11-03-teras-siaga-360-disaster-climate-resilience.md](file:///d:/GELLONA/PROJECT/Teras-Warga-RT-002/docs/superpowers/plans/2026-11-03-teras-siaga-360-disaster-climate-resilience.md)

## Global Constraints
- Preserve signature warm community palette (indigo, warm amber, emerald, slate).
- No slop (no aggressive `animate-ping`, no unnecessary bouncy animations, no unoptimized blur blobs).
- All numbers and counts must use `font-mono tabular-nums`.
- Clean responsive layout across all viewports (320px mobile to 1920px desktop).
- Zero TypeScript errors (`npx tsc --noEmit`) and successful production build (`npm run build`).

## Review Focus
1. **Offline/Fallback Resilience:** If Gemini AI or weather APIs are temporarily unreachable, the advisory card must immediately fall back to intelligent heuristic safety logic without crashing or rendering blanks.
2. **Non-Stigmatizing UI:** Vulnerability indicators for lansia/balita must look dignified, tactical, and civic-focused (supportive rescue priority), never intrusive or alarmist.
3. **Responsive Mobile Usability:** Map overlays, dropdowns, and advisor cards must not overflow on narrow mobile screens (320px–375px).
4. **Performance:** Demographic aggregations across 129+ houses must be memoized with `useMemo` to prevent laggy SVG map panning.
5. **Accurate Coordinates:** Episentrum distances must always calculate relative to exact Huntap Tondo 2 coordinates (`TONDO_LAT: -0.851176`, `TONDO_LON: 119.904426`).

---

### Task 1: AI Climate & Disaster Risk Advisory Service & Heuristic Fallback Engine

**Files:**
- Modify: `services/geminiService.ts`
- Modify: `types.ts`

- [ ] **Step 1.1: Define TypeScript Types for Climate & Disaster Advisory**
  In `types.ts`, add:
  ```ts
  export interface ClimateDisasterContext {
    weatherTemp?: number;
    weatherAqi?: number;
    weatherCondition?: string;
    nearestEarthquakeDistanceKm?: number | null;
    nearestEarthquakeMagnitude?: string | null;
    vulnerableCounts: {
      elderly: number;
      infantsAndToddlers: number;
      pregnant: number;
      total: number;
    };
  }

  export interface ClimateAdvisoryResult {
    threatLevel: 'Aman' | 'Waspada' | 'Siaga';
    headline: string;
    seismicAssessment: string;
    climateAssessment: string;
    actionTips: string[];
    generatedAt: string;
    isAiGenerated: boolean;
  }
  ```

- [ ] **Step 1.2: Implement `generateDisasterClimateAdvisory` in `services/geminiService.ts`**
  Add service function with heuristic fallback logic that checks:
  - If nearest earthquake $< 75\text{km}$ & magnitude $\ge 4.5 \rightarrow$ 'Siaga' / 'Waspada Seismik'.
  - If Palu temp $\ge 34^\circ\text{C}$ & AQI $> 60 \rightarrow$ Extreme heat & bushfire risk.
  - If rain/storm $\rightarrow$ Hill runoff drain check.
  - Return clean `ClimateAdvisoryResult`.

- [ ] **Step 1.3: Verify Type Safety & Execution**
  Run `cmd.exe /c "npx tsc --noEmit"` and confirm 0 errors.

---

### Task 2: Vulnerability Density Layer & Popover in `InteractiveHuntapMap.tsx`

**Files:**
- Modify: `components/InteractiveHuntapMap.tsx`

- [ ] **Step 2.1: Accept `houses` prop and compute vulnerability density per block**
  Update `InteractiveHuntapMapProps`:
  ```ts
  interface InteractiveHuntapMapProps {
    houses?: House[];
    selectedBlockId?: string | null;
    onSelectBlock?: (blockId: string) => void;
  }
  ```
  Aggregate `vulnerableStatsByBlock` for each block code (`C5`..`C12`, `A1`..`F4`):
  `elderlyCount`, `babyCount + toddlerCount`, `pregnantCount`.

- [ ] **Step 2.2: Add Layer Filter Button "Prioritas Evakuasi (Kelompok Rentan)"**
  Add filter button alongside existing filters (ALL, RW19, RW20):
  - When active, blocks with vulnerable residents display a soft amber/rose civic indicator badge.
  - Color fill adjusts subtly to indicate priority assistance readiness.

- [ ] **Step 2.3: Enhance Block Popover with Priority Evacuation Summary**
  When hovering or tapping a block:
  - Show breakdown: "X Lansia, Y Balita, Z Ibu Hamil".
  - Show "Rute Aman: Menuju Lapangan Terbuka Utama".

- [ ] **Step 2.4: Verify Visual Polish & Responsiveness**
  Ensure badges scale cleanly on mobile viewports.

---

### Task 3: SADAR AI Advisor Card & Evacuation Route Simulator in `PublicEarthquake.tsx`

**Files:**
- Modify: `components/public/PublicEarthquake.tsx`
- Modify: `components/public/PublicMap.tsx`

- [ ] **Step 3.1: Pass `houses` into `PublicEarthquake` via `PublicMap`**
  Ensure resident data is forwarded from `App.tsx` $\rightarrow$ `PublicMap.tsx` $\rightarrow$ `PublicEarthquake.tsx`.

- [ ] **Step 3.2: Build "SADAR RT 002 - AI Climate & Disaster Advisor" Card**
  Render at top of `evacuation` tab in `PublicEarthquake.tsx`:
  - Threat level badge (`Aman` [emerald], `Waspada` [amber], `Siaga` [rose]).
  - Live metric chips: Jarak Gempa Terdekat (Sesar Palu-Koro), Suhu Teluk Palu, Indeks Kualitas Udara (ISPU).
  - AI synthesized actionable tips for residents and RT disaster task force.
  - Refresh button with loading animation.

- [ ] **Step 3.3: Build "Simulator Rute Evakuasi Mandiri Per Kavling"**
  Below the advisor card:
  - Dropdown selector for resident's house (e.g., "Blok C10 - Kavling No. 04").
  - Displays:
    * Titik Kumpul Darurat Terdekat: Lapangan Utama Huntap Tondo 2.
    * Estimasi Waktu Evakuasi Jalan Kaki: ~2-3 menit.
    * Rute Aman: Melewati Jalan Lingkungan Poros Utama Huntap Tondo 2, menjauhi tebing talud lereng utara.
    * Checklist Kilat Sebelum Keluar Rumah: Matikan kompor gas, bawa Tas Siaga, kunci pintu utama, dampingi lansia/anak.
    * Tombol WhatsApp darurat cepat ke Pos Ronda & Ketua RT.

- [ ] **Step 3.4: Verify Evacuation Tab Usability**
  Test tab switching, simulator interactivity, and responsive layout.

---

### Task 4: Admin RT Roster Prioritas Evakuasi di `DemographicAnalytics.tsx`

**Files:**
- Modify: `components/admin/DemographicAnalytics.tsx`

- [ ] **Step 4.1: Add "Roster Prioritas Evakuasi & Mitigasi (SADAR RT 002)" Section**
  Filter houses where `elderlyCount > 0 || babyCount > 0 || toddlerCount > 0 || pregnantCount > 0`.
  Display a structured, searchable table:
  - Kavling & Blok
  - Nama Kepala Keluarga
  - Rincian Anggota Rentan (tag badge: "1 Lansia", "1 Bayi", dsb.)
  - Kontak Telepon / WhatsApp Cepat
  - Status Aksesibilitas (Lantai 1 / Perlu Bantuan Kursi Roda/Tandu)

- [ ] **Step 4.2: Add Export & Quick Broadcast Capability**
  Allow RT officials to copy or download the emergency roster for civil defense / linmas during disaster drills.

---

### Task 5: End-to-End Verification, TypeScript Check & Production Deployment

- [ ] **Step 5.1: Run TypeScript Type Check**
  Run `cmd.exe /c "npx tsc --noEmit"` and verify 0 errors.

- [ ] **Step 5.2: Run Vite Production Build**
  Run `cmd.exe /c "npm run build"` and verify bundle compilation.

- [ ] **Step 5.3: Commit, Push & Deploy to Vercel**
  Push to `main` branch and verify Vercel production deployment status `READY`.
