---
phase: 02-git-repository-read-path
plan: 01
subsystem: git-integration
tags: [vscode, vscode.git]

requires: []
provides:
  - Vendored git.d.ts aligned to VS Code 1.96.4 API
  - getGitApi() with enablement and missing-extension errors
  - resolveRepositoryForWorkspace() per CONTEXT disambiguation rules
affects: [phase-02-plan-02]

tech-stack:
  added: []
  patterns: [type-only imports from vendor d.ts; const-enum Head literal in branches module]

key-files:
  created:
    - src/types/git.d.ts
    - src/git/api.ts
    - src/git/repositoryPicker.ts
  modified:
    - src/extension.ts

key-decisions:
  - "Path compare without @types/node: slash-normalize + drive-letter case fold only."

patterns-established:
  - "Git errors and missing repo use showErrorMessage with Branch Cleaner prefix."

requirements-completed: [GIT-01, GIT-03]

duration: —
completed: 2026-04-14
---

# Plan 01 summary — Git API and repository resolution

Implemented `getGitApi`, workspace-to-`Repository` resolution (active URI via `getRepository`, then folder root match), and vendored `git.d.ts` from vscode 1.96.4. Extension command surfaces configuration errors instead of throwing uncaught.
