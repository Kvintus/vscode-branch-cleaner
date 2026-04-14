---
phase: 02-git-repository-read-path
plan: 02
subsystem: git-integration
tags: [vscode, branches]

requires: [02-01-SUMMARY]
provides:
  - listLocalBranches() returning LocalBranchSummary DTOs from getBranches({ remote: false })
  - Command shows local branch count and HEAD name
affects: [phase-03-domain]

tech-stack:
  added: []
  patterns: [Filter RefType head via literal 0 to avoid bundling const-enum from .d.ts]

key-files:
  created:
    - src/git/branches.ts
  modified:
    - src/extension.ts

key-decisions:
  - "getBranches returns Ref[]; narrow with type === 0 (Head) and required name."

patterns-established:
  - "Read-only Git path: no delete/checkout in phase 2."

requirements-completed: [GIT-02, GIT-03]

duration: —
completed: 2026-04-14
---

# Plan 02 summary — Local branch enumeration

`listLocalBranches` maps local heads to `LocalBranchSummary` including upstream when present. Command reports count and HEAD after successful resolution.
