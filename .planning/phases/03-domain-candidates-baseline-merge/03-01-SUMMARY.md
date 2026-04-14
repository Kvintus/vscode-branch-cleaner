---
phase: 03-domain-candidates-baseline-merge
plan: 01
subsystem: testing
tags: [vitest, domain, baseline, candidates, typescript]

requires:
  - phase: 02-git-read
    provides: LocalBranchSummary shape from listLocalBranches
provides:
  - Vitest Node unit harness (npm run test:unit via vitest.config.mts)
  - Pure src/domain modules for abandonment candidates and origin baseline ladder from ref snapshots
  - BaselineResolutionError for no usable remote baseline
affects: [phase-03-plan-02, phase-04]

tech-stack:
  added: [vitest@^4.1.4]
  patterns: [Pure domain DTO-in/DTO-out; Vitest 4 config as .mts while package stays CJS]

key-files:
  created:
    - vitest.config.ts
    - vitest.config.mts
    - src/domain/types.ts
    - src/domain/candidates.ts
    - src/domain/baseline.ts
    - src/domain/candidates.test.ts
    - src/domain/baseline.test.ts
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "npm run test:unit uses vitest.config.mts so Vitest 4 loads native ESM config without setting package type module."
  - "Baseline symref step matches origin/HEAD tip OID to a concrete origin/* ref before fixed main/master/sorted fallbacks."

patterns-established:
  - "Domain stays free of runtime vscode imports so Vitest can import git orchestration that only uses type-only vscode imports."

requirements-completed: [DOM-01, DOM-02, QUAL-01]

duration: 25min
completed: 2026-04-14
---

# Phase 03: Domain — Plan 01 summary

**Vitest-backed pure domain for gitcleaner-style abandoned locals and D-04 baseline ordering from origin remote ref snapshots, with a typed no-baseline error for adapters.**

## Performance

- **Duration:** ~25 min
- **Tasks:** 2 (+ Vitest config fix)
- **Files modified:** 10

## Accomplishments

- Added **Vitest** with Node environment and `src/**/*.test.ts` includes.
- Implemented **listCleanupCandidates** / **isAbandonedCandidate** per D-01/D-02.
- Implemented **resolveBaselineFromOriginRemoteRefs** with HEAD symref-by-tip, main, master, and lexicographic `origin/*` fallback.

## Task Commits

1. **Task 1: Vitest devDependency, config, test:unit** — `9254192`
2. **Vitest ESM config entry** — `0276aa6`
3. **Task 2: Domain types, candidates, baseline, tests** — `a69a3b5`

## Files Created/Modified

- `vitest.config.mts` — ESM Vitest config consumed by npm script
- `vitest.config.ts` — Mirror for tooling/docs expecting `.ts` at repo root
- `src/domain/types.ts` — ResolvedBaseline, BaselineResolutionError, DTOs
- `src/domain/candidates.ts` — Abandonment + candidate listing
- `src/domain/baseline.ts` — Baseline ladder from ref snapshots
- `src/domain/*.test.ts` — Fixture coverage for DOM-01/02/03 ordering slice

## Self-Check: PASSED

- `npm run test:unit` — exit 0
- `npm run check-types` — exit 0
