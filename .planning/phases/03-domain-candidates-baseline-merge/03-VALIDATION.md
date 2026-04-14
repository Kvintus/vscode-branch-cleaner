---
phase: 3
slug: domain-candidates-baseline-merge
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-14
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x |
| **Config file** | `vitest.config.ts` (added in Wave 0 / Plan 01) |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npm run check-types && npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npm run check-types && npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD | 01 | 1 | QUAL-01 / Wave 0 | — | N/A | unit | `npx vitest run` | ⬜ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Vitest devDependency + `vitest.config.ts` targeting `src/domain/**/*.test.ts`
- [ ] `npm run test:unit` or `npx vitest run` script in `package.json`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Real `getMergeBase` on odd remotes | DOM-04 | API + repo shape variance | Open extension in VS Code with sample repo after adapter lands |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency under target
- [ ] `nyquist_compliant: true` set in frontmatter when approved

**Approval:** pending
