---
phase: 01-extension-scaffold-activation-and-packaging
plan: 01
subsystem: extension
tags: [vscode, esbuild, typescript]

requires: []
provides:
  - Loadable extension manifest with Git: Cleanup Branches command
  - Lazy activation (onCommand + workspaceContains .git)
  - esbuild bundle to dist/extension.js with vscode externalized
affects: [phase-02-git-read]

tech-stack:
  added: [typescript@6.0.2, esbuild@0.28.0, @types/vscode@^1.96.0, @vscode/vsce@3.7.1, npm-run-all]
  patterns: [tsc --noEmit then esbuild; CJS bundle for extension host]

key-files:
  created:
    - package.json
    - package-lock.json
    - tsconfig.json
    - esbuild.js
    - src/extension.ts
    - .gitignore
  modified: []

key-decisions:
  - "Used engines.vscode and @types/vscode both at ^1.96.0 per plan must-haves."
  - "Publisher set to local for local VSIX packaging until a real publisher is chosen."

patterns-established:
  - "npm run compile runs check-types then esbuild; npm run package adds production minify."

requirements-completed: [EXT-01, EXT-02, EXT-03, EXT-04]

duration: 20min
completed: 2026-04-14
---

# Phase 01: Extension scaffold — Plan 01 summary

**Greenfield VS Code extension package with lazy Git-aware activation, vscode.git dependency, and an esbuild + TypeScript check pipeline that produces `dist/extension.js`.**

## Performance

- **Duration:** ~20 min
- **Tasks:** 2
- **Files modified:** 6 tracked paths (dist/ gitignored)

## Accomplishments

- Declared **Cleanup Branches** under category **Git** with stable command id `branchCleaner.cleanupBranches`.
- Wired **activationEvents** to `onCommand` plus `workspaceContains:**/.git` with no `*` activation.
- Added **compile** / **package** scripts with `external: ['vscode']` bundling.

## Task Commits

1. **Task 1: package.json, tsconfig, and esbuild bundle script** — `78ae629`
2. **Task 2: Extension entrypoint and compile verification** — `9b83b0e`

## Files Created/Modified

- `package.json` — manifest, scripts, contributes, extensionDependencies
- `tsconfig.json` — strict, noEmit typecheck for `src/**/*.ts`
- `esbuild.js` — bundle entry to `dist/extension.js`
- `src/extension.ts` — registers placeholder command
- `.gitignore` — `node_modules/`, `dist/`, `*.vsix`

## Decisions & Deviations

None — followed `01-PLAN.md` as specified.

## Next Phase Readiness

Extension host entrypoint and manifest are in place; Phase 2 can add Git API repository wiring on top of this scaffold.

## Self-Check: PASSED
