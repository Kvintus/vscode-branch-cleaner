---
phase: 5
slug: safety-local-deletion-and-outcomes
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-14
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest |
| **Config file** | `vitest.config.mts` |
| **Quick run command** | `npm run test:unit -- src/git/cleanupDeleteSummary.test.ts` |
| **Full suite command** | `npm run test:unit` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:unit -- <touched-test-glob>`
- **After every plan wave:** Run `npm run test:unit`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 5-01-01 | 01 | 1 | SAFE-01 | T-05-01 | Confirm before force-delete of not_merged/unknown | manual UAT | — | — | pending |
| 5-01-02 | 01 | 1 | SAFE-02 | T-05-02 | Only `deleteBranch`; no remote ops | grep + code review | `rg` gates in plan | — | pending |
| 5-01-03 | 01 | 1 | SAFE-03 | T-05-03 | Modal summary lists outcomes | manual UAT | — | — | pending |
| 5-02-01 | 02 | 2 | SAFE-03 | — | Ordering failures-first in pure helper | unit | `npm run test:unit -- src/git/cleanupDeleteSummary.test.ts` | — | pending |

*Status: pending / green / flaky*

---

## Wave 0 Requirements

- [ ] `src/git/cleanupDeleteSummary.ts` — pure formatting helper (if extracted)
- [ ] `src/git/cleanupDeleteSummary.test.ts` — stubs for SAFE-03 ordering

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Modal gate + delete | SAFE-01 | Needs Extension Host / real Git | Select not_merged branch; confirm Cancel leaves branch; confirm Proceed deletes locally only |
| Summary after partial failure | SAFE-03 | Message API + Git errors | Force a failure (e.g. delete current branch attempt blocked); verify modal lists failure first |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
