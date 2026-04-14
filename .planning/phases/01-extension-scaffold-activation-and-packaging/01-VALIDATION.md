---
phase: 1
slug: extension-scaffold-activation-and-packaging
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-14
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | TypeScript 6.x + npm scripts (no application test runner required in Phase 1) |
| **Config file** | `tsconfig.json` (created in Wave 1) |
| **Quick run command** | `npm run compile` (must run `tsc --noEmit` and production bundle step per PLAN) |
| **Full suite command** | `npm run compile && npx @vscode/vsce package --no-dependencies` (or project-local `vsce package`) |
| **Estimated runtime** | ~30–90 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run compile`
- **After every plan wave:** Run full suite command above
- **Before `/gsd-verify-work`:** `npm run compile` green; VSIX produced without vsce errors
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-PLAN T1 | 01 | 1 | EXT-01–04 | T-01-01 | Pin deps; no `*` activation | grep + node | `npm run compile` (after scaffold) | package.json | ⬜ pending |
| 01-PLAN T2 | 01 | 1 | EXT-01–04 | T-01-02 | No secrets in placeholder message | compile | `npm run compile` | dist/extension.js | ⬜ pending |
| 02-PLAN T1 | 02 | 2 | — | T-01b-01 | VSIX includes bundle | file check | `test -f .vscodeignore` | .vscodeignore | ⬜ pending |
| 02-PLAN T2 | 02 | 2 | QUAL-02 | T-01b-02 | No credentials in README | doc grep + vsce | `rm -f *.vsix && npm run compile && npx --yes @vscode/vsce@3.7.1 package -o vscode-branch-cleaner-0.0.1.vsix` | README.md | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `package.json` exists with `scripts.compile` (or equivalent) invoking `tsc --noEmit` and bundle
- [ ] `src/extension.ts` entry activates and registers command id referenced in manifest

*Wave 0 = first executable scaffold from Plan 01.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Command Palette shows **Git: Cleanup Branches** | EXT-01 | Palette grouping is host UX | F5 → Extension Development Host → Command Palette → search "Cleanup Branches" |
| Extension stays inactive until command or git workspace rule fires | EXT-02 | Activation timing | Reload window without invoking command; confirm no activation logs if optional logging added |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags in CI verification steps
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
