# Feature Research

**Domain:** VS Code / Cursor extension — local Git branch cleanup (gitcleaner-style workflow)
**Researched:** 2026-04-14
**Confidence:** MEDIUM (grounded in PROJECT.md and VS Code API reference; marketplace alternatives not exhaustively surveyed)

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist for a **gitcleaner-like** cleanup flow inside the editor. Missing these = product feels incomplete or unsafe compared to opening WebStorm.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Command palette entry** | Power users invoke everything from the palette; parity with “an action I run” in JetBrains. | LOW | Contribute a command in `package.json` (`commands`) with a clear `title` (e.g. **Cleanup Branches**) and `category` (e.g. **Git**) so search terms match intent. Optional: keybinding later — not required for v1 mental model. |
| **Discover cleanup candidates (gitcleaner-style rules)** | Core promise: not “all locals,” but branches that look **abandoned** — typically **no upstream** or **missing / invalid tracking** (divergent from gitcleaner’s “no remote branch” idea). Users expect the list to match that intuition. | MEDIUM | Depends on parsing `git branch -vv` (or equivalent) and classifying upstream state (`gone`, none, etc.). Rules must be **documented in UX** (tooltip / detail line) so users trust the list. |
| **Exclude current branch** | Obvious safety: you cannot delete the branch you are on without checkout dance; listing it confuses and risks errors. | LOW | Filter before merge checks to save work; still show a short message if **zero** candidates. |
| **Merge indicator vs default integration branch** | gitcleaner users look for **merged / not merged** before deleting. PROJECT decision: baseline = **`origin/HEAD`** (repo default), not “merged into whatever you have checked out.” | MEDIUM–HIGH | Requires resolving symbolic ref / remote HEAD (`git symbolic-ref refs/remotes/origin/HEAD` or `git remote show origin`) and `git branch --merged <baseline>`. **Fallback** when `origin/HEAD` missing or ambiguous is part of the same expectation — users expect a **named** comparison branch in the UI, not silence. |
| **Explicit selection of branches to delete** | JetBrains flow is **review → pick → act**; no “delete all candidates.” Users expect to **omit** branches from deletion without leaving the flow. | MEDIUM | **QuickPick multi-select:** `window.showQuickPick` with `QuickPickOptions & { canPickMany: true }` returns `T[] \| undefined`; `undefined` = cancel. For **per-item actions** (e.g. icon buttons), `window.createQuickPick` offers more control (`QuickPickItem` buttons fire `QuickPickItemButtonEvent`; item buttons are **not** rendered with `showQuickPick` per API). Initial “pre-checked” merged-only defaults may use `picked` on items (honored with `showQuickPick`). |
| **Safety on non-merged selections** | Users expect **gitcleaner-style guardrails**: do not silently delete work that is not fully merged into the **same** comparison branch used in the list, or show a **hard block / strong confirm** consistent with that expectation. | MEDIUM | Implement as: filter non-merged from delete set **or** second confirmation with explicit branch names **or** refuse with actionable message. Align UX copy with chosen rule so “merged” in the list and “allowed to delete” never feel contradictory. |
| **Cancellation / no-op on dismiss** | Closing QuickPick or Esc must **never** mutate branches. | LOW | Treat `undefined` / hide events as cancel; no partial deletes mid-list. |
| **Clear errors for broken Git state** | Not a valid repo, Git missing, or command failures — users expect a **VS Code notification** or message, not a silent failure. | LOW–MEDIUM | Use `git` in PATH or VS Code’s git discovery patterns; surface stderr snippets where safe. |

### Differentiators (Competitive Advantage)

Features that set **this** extension apart from a generic “list branches” tool while staying in v1 scope.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Named merge baseline in UI** | Reduces mistrust vs extensions that merge-check against `main` implicitly. Shows **“Merged into `<resolved baseline>`”** (or fallback label) in description / title. | LOW–MEDIUM | Depends on **baseline resolution** feature; high trust return for small UI cost. |
| **Configurable default remote / branch (settings)** | Monorepos, non-`origin` remotes, or corporate defaults: power users want **one setting** instead of fighting auto-detection. | MEDIUM | `contributes.configuration`: e.g. `branchCleaner.defaultRemote`, `branchCleaner.mergeBaselineBranch` (optional override of `origin/HEAD`). **Precedence** should be documented: explicit setting > `origin/HEAD` > fallback heuristic. |
| **“Upstream gone” as first-class candidate signal** | Many teams already use `git fetch --prune`; locals tracking **deleted** remotes are prime cleanup targets and align with gitcleaner’s spirit. | MEDIUM | May overlap candidate rules; treat as **tag** on row (detail line) to avoid hiding other candidate types. |
| **createQuickPick refinement pass** | Optional v1.x: per-row **Keep** / **Info** without leaving modal, sort groups (merged first), separators (`QuickPickItemKind.Separator`). | MEDIUM–HIGH | **Enhances** selection UX; requires `createQuickPick` + manual accept handler. |
| **Dry-run summary step** | Short final confirmation: “Delete N branches: …” — differentiator vs one-click reckless tools. | LOW | **Enhances** safety story; can be combined with non-merged blocking. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **One-click “delete all merged” without pick list** | Speed for confident users. | Conflicts with **explicit selection** core value; wrong baseline or stale `origin/HEAD` → data loss narrative even if Git could recover. | Keep multi-select; optionally **pre-select** all merged candidates so one Enter after review is fast. |
| **Remote / host branch deletion (v1)** | “Clean everything everywhere.” | Explicitly **out of scope** in PROJECT.md; expands failure modes (auth, permissions, shared branches). | **Local delete only** for v1; document path to future phase if ever. |
| **Pursuing full JetBrains plugin edge-case parity before ship** | Completeness. | Blocks shipping **documented flow**; many edge cases need real-world validation. | Ship **origin/HEAD + fallback + candidate rules**; log gaps for v1.x. |
| **Non-Git VCS support** | Unified tool. | Out of scope; dilutes testing matrix. | Git only. |
| **“Undo” as in-app magic** | Users say “undo.” | Git does not give extensions a universal **undelete branch** without knowing reflog timing / user actions elsewhere. | Position **safety** as prevention + **optional** hint: “Recover via Reflog” doc link; do not promise one-click undo. |
| **Auto-run cleanup on folder open / git fetch** | Always tidy. | Surprising deletes (even if merged) violate **safe, explicit** positioning; fetch hooks are noisy. | **Manual command only** unless user explicitly opts in later (separate controversial setting). |

## Feature Dependencies

```
[Git repo detection / exec]
    └──requires──> [Candidate discovery rules]
                           └──requires──> [Exclude current branch]
                           └──requires──> [Baseline resolution (origin/HEAD + fallback)]
                                    └──requires──> [Merge indicators per candidate]
                                             └──requires──> [QuickPick multi-select UI]
                                                      └──requires──> [Non-merged safety gate]
                                                               └──requires──> [Local branch delete (git branch -d/-D)]

[Settings: default remote / merge baseline]
    └──enhances──> [Baseline resolution]

[Command palette registration]
    └──requires──> [Single entry command wiring]

[Clear error / notification surface]
    └──requires──> [Git repo detection / exec]
```

### Dependency Notes

- **Candidate discovery** requires reliable **Git execution** and a defined **upstream interpretation**; without that, merge indicators are meaningless noise.
- **Merge indicators** depend on **baseline resolution**; order roadmap so baseline + merge check are solid before polishing QuickPick chrome.
- **QuickPick multi-select** depends on having **stable item ids** (branch names) so selection maps cleanly to delete targets after async refresh.
- **Non-merged safety gate** must use the **same baseline** as the UI labels, or user trust collapses.
- **Settings** enhance baseline resolution but add **precedence / test matrix** cost — implement after happy path or with TDD on precedence from day one (product choice).

## MVP Definition

### Launch With (v1)

Minimum viable product — validates “stop opening WebStorm for this.”

- [ ] **Contributed command + command palette** — discoverable **Cleanup Branches** entry.
- [ ] **gitcleaner-style candidate rules** — documented behavior; exclude **current** branch.
- [ ] **Merge state** — merged / not merged vs **`origin/HEAD`** (with **documented fallback** when missing).
- [ ] **Multi-select QuickPick** — user chooses which candidates to delete; cancel is safe.
- [ ] **Safety** — non-merged handling matches PROJECT.md (block or explicit warn; no silent delete of selected non-merged per expectation).
- [ ] **Local delete only** — `git branch -d` / `-D` as appropriate to merged state and chosen safety policy.

### Add After Validation (v1.x)

- [ ] **Settings** for default remote / explicit merge baseline — trigger: user reports wrong auto baseline.
- [ ] **createQuickPick** UX — row buttons, grouping, richer detail — trigger: feedback that palette list feels cramped.
- [ ] **Dry-run confirmation** — trigger: fear of mis-click despite multi-select.

### Future Consideration (v2+)

- [ ] **Remote deletion** on host — only after v1 trust and clear scope.
- [ ] **Bulk automation / scheduled cleanup** — conflicts with explicit-editor flow unless heavily gated.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Command + palette entry | HIGH | LOW | P1 |
| Candidate rules + exclude current | HIGH | MEDIUM | P1 |
| Baseline resolution + merge indicators | HIGH | MEDIUM–HIGH | P1 |
| QuickPick multi-select delete flow | HIGH | MEDIUM | P1 |
| Non-merged safety gate | HIGH | MEDIUM | P1 |
| Clear Git error handling | MEDIUM | LOW | P1 |
| Settings (remote / baseline override) | MEDIUM | MEDIUM | P2 |
| Dry-run confirmation | MEDIUM | LOW | P2 |
| createQuickPick polish | MEDIUM | MEDIUM–HIGH | P2 |
| Pre-select merged-only default | MEDIUM | LOW | P2 |

**Priority key:**

- **P1:** Must have for launch (matches Active requirements in PROJECT.md).
- **P2:** Should have once core validated or friction appears in dogfooding.
- **P3:** Nice to have / future (not listed above as P3 to avoid noise).

## Competitor Feature Analysis

| Feature | gitcleaner (JetBrains) | Typical generic “Git branches” tooling | Our Approach |
|---------|------------------------|----------------------------------------|--------------|
| Entry point | IDE action / menu | Often SCM view or ad hoc commands | **Command palette**-first **Cleanup Branches** + optional later SCM integration |
| Candidate definition | “No remote tracking” style (per original README / plugin behavior) | Often lists all locals or only merged | **gitcleaner-style** locals (no / unusable upstream); **document** exact rules |
| Merge reference | Historically “merged into current” in README; users may vary | Often implicit `main` | **Explicit `origin/HEAD`** + **fallback** + optional **setting override** |
| Selection | IDE dialog with checkboxes | Varies | **QuickPick `canPickMany`** (or `createQuickPick` if buttons needed) |
| Remote delete | Not required for this PROJECT’s v1 | Some tools offer | **Out of scope v1** per PROJECT.md |

## Edge Cases Users Expect (Within “Documented Flow”)

| Edge case | User expectation | Product note |
|-----------|------------------|----------------|
| **Detached HEAD** | No “current branch” in normal sense; cleanup may still be wanted. | Define behavior: exclude nothing vs exclude invalid; **message** if ambiguous. |
| **No `origin` / no `origin/HEAD`** | Still see candidates + know **what** merge means. | **Fallback branch** (e.g. `main` / `master` heuristic) + **visible** label in UI. |
| **Shallow clone / incomplete refs** | Merge detection may lie or fail. | Surface **warning** in list or notification; LOW confidence without fetch. |
| **Unmerged work on merged-looking branch** | Rare confusion if squash-merge culture. | Document: **“merged” = Git ancestry to baseline**, not “PR merged on GitHub”; optional future **policy** toggle (research flag). |
| **Protected / default branch in list** | Should never appear as deletable candidate or should warn heavily. | Exclude **`HEAD`** of baseline from delete set; optional extra guard for configured **protected** names. |
| **Worktrees** | Branch checked out elsewhere. | `git branch -d` may refuse — show **stderr** as user-actionable (not extension crash). |
| **Case / refname quirks on Windows** | Same as Git. | Normalize display; pass through to Git consistently. |

## Sources

- In-repo product definition: `.planning/PROJECT.md` (requirements, out of scope, key decisions).
- Prior art: [PavlikPolivka/gitcleaner](https://github.com/PavlikPolivka/gitcleaner) (JetBrains plugin README / behavior as reference, not verbatim spec).
- VS Code extension API — QuickPick / multi-select: [Visual Studio Code API — `window.showQuickPick` / `QuickPickOptions.canPickMany` / `createQuickPick`](https://code.visualstudio.com/api/references/vscode-api) (verified 2026-04-14).

---
*Feature research for: VS Code Branch Cleaner (gitcleaner-like local branch cleanup)*
*Researched: 2026-04-14*
