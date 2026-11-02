# Teras Warga RT 002 - Agent Guidelines & Superpowers

This repository adopts the **Superpowers** development methodology. All AI agents operating in this workspace must adhere to these disciplined workflows.

---

## 1. Superpowers Core Workflow

- **Check & Invoke Skills First:**
  Always determine and announce the applicable skill (`Using [skill] to [purpose]`) before taking action or writing code.
- **Brainstorming Before Implementation (`brainstorming`):**
  Explore requirements, clarify user intent, and align on design specifications before writing implementation plans or touching code.
- **Structured Planning (`writing-plans` & `executing-plans`):**
  Break complex features into bite-sized, verifiable tasks with measurable outcomes.
- **Test-Driven Development (`test-driven-development`):**
  Write tests first, confirm failure, then implement minimal code to pass tests.
- **Root-Cause Debugging (`systematic-debugging`):**
  Investigate and prove the root cause before proposing or applying fixes.
- **Strict Verification (`verification-before-completion`):**
  Run builds, tests, and static analysis to verify correctness with concrete evidence before claiming completion or pushing code.

---

## 2. Project-Specific Conventions (Teras Warga RT 002)

- **UI & Brand Palette:** Preserve the signature warm, community-focused palette (amber/orange accents, clean category pastel cards, dark navy/indigo widgets, tabular figures `font-mono tabular-nums`). Avoid slop (no aggressive blinking `animate-ping`, no unnecessary bouncy animations, no unoptimized blur blobs).
- **Sorting & Data Consistency:** Maintain natural alphanumeric sorting for house numbers and RT block codes (e.g. C5 - C12).
- **Deployment & Stability:** Ensure `npm run build` passes with zero errors before pushing to `main` for Vercel production deployment.
