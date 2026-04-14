---
phase: 4
slug: cleanup-review-ui
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-14
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution (cleanup review QuickPick).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (existing in repo for domain) |
| **Config file** | `vitest.config.mts` |
| **Quick run command** | `npm run test` / `npm run test:unit` |
| **Full suite command** | Same as quick unless split later |
| **Estimated runtime** | ~10–30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test` (or project quick test script)
- **After every plan wave:** Full test suite + `npm run compile` if present
- **Before `/gsd-verify-work`:** Full suite green; manual UAT for UXP-01–03
- **Max feedback latency:** 120 seconds (includes Extension Host smoke if run locally)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD | 01 | 1 | UXP-01 | — | No `deleteBranch` in Phase 4 paths | manual + rg | `rg deleteBranch src` — no new delete calls in Phase 4 | TBD | pending |
| TBD | 01 | 1 | UXP-03 | — | Baseline copy in picker chrome | manual | Extension Host: title/placeholder shows baseline | TBD | pending |
| TBD | 02 | 1 | UXP-02 | — | No bulk-delete control | manual + review | No control/copy implying delete-all without picks | TBD | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] Optional: unit tests for **pure** sort/map helpers if extracted from `extension.ts` (merged / not_merged / unknown + localeCompare)
- [ ] If no new pure helpers: "Existing infrastructure + manual UAT covers Phase 4"

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Multi-select QuickPick + Escape | UXP-01 | Native UI | Run **Cleanup Branches**; open picker; Escape; confirm no branch deleted (Phase 5 not run); repo unchanged |
| Baseline visible during review | UXP-03 | Visual | Confirm `title` or `placeHolder` shows same baseline as domain `displayLabel` |
| No "delete all" shortcut | UXP-02 | UX judgment | Confirm no primary action deletes all without per-row selection intent |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 / manual map above
- [ ] Sampling continuity maintained during execution
- [ ] No watch-mode flags in CI verification steps
- [ ] `nyquist_compliant: true` set in frontmatter after execution passes

**Approval:** pending
