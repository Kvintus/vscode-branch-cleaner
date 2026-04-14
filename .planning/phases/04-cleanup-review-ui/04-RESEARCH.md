# Phase 4: Cleanup review UI — Research

**Researched:** 2026-04-14  
**Domain:** VS Code Extension API (`vscode.window` QuickPick), integration with `buildCleanupRunPlan`  
**Confidence:** HIGH for API surface and integration points; MEDIUM for edge cases (empty accept vs cancel, built-in “select all” behaviors)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

From `.planning/phases/04-cleanup-review-ui/04-CONTEXT.md` — **Implementation Decisions**:

- **D-01:** Use **`QuickPickItem.iconPath`** with **`vscode.ThemeIcon`** (Codicons) per row so merge state is visible at a glance, in the spirit of **gitcleaner / JetBrains-style** visual cues.
- **D-02:** Each row includes a **`detail`** line with **plain-language** merge state for the **same resolved baseline** as the run: e.g. merged into `{baseline label}`, not merged into `{baseline label}`, and **could not verify** (or equivalent) for **unknown** — so labels stay interpretable and accessible (not icon-only).
- **D-03:** The **`label`** is the **branch short name**; merge state is conveyed via **icon + detail**, not by hiding text behind icons only.
- **D-04:** Candidates are sorted **merged first**, then **not merged**, then **unknown**; within each group, **alphabetical by branch name**.
- **D-05:** Baseline placement was **not** discussed in this session. **Requirement remains:** the user must see the **resolved baseline** alongside merge indicators. **Default for planning:** surface `plan.baseline.displayLabel` in **QuickPick chrome** (e.g. **`title`** and/or **`placeholder`**) so it is visible for the whole review; avoid relying only on a one-shot notification before the picker opens.

### Claude's Discretion

- Exact **Codicon** ids per merge state and exact **detail** string wording (punctuation, baseline interpolation).
- Whether **`showQuickPick` (`canPickMany`)** or **`createQuickPick`** is used — choose the smallest API that satisfies **D-01–D-05** and **title/baseline** visibility.
- Exact **empty-candidate** copy and whether to use an **information message** vs an empty picker (must remain a **no-op** on cancel).

### Deferred Ideas (OUT OF SCOPE)

From **Deferred Ideas** (and phase boundary): **Remote/host deletion**, **non-merged safety policy**, **post-delete summary** — **Phase 5**. **Picker mechanism** (`showQuickPick` vs `createQuickPick`) — deferred to implementation discretion (not user-locked). **Zero candidates**, **Escape**, **OK with no selection** — not fully specified in context; planner must satisfy **UXP-01** and clarify UX copy.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description (from `.planning/REQUIREMENTS.md`) | Research support |
|----|--------------------------------------------------|------------------|
| **UXP-01** | User reviews candidates in a **multi-select QuickPick** (or equivalent native selection UX) and can **cancel** with **no branch mutations**. | `QuickPickOptions.canPickMany` / `QuickPick.canSelectMany`; dismissal resolves to `undefined` per API typings; Phase 4 must not call `deleteBranch` or any delete API. |
| **UXP-02** | User **explicitly selects** which candidates to delete; there is **no** v1 “delete all” shortcut that bypasses review. | Avoid control copy implying bulk delete; avoid pre-selecting all merged rows as “picked” ([CITED: GitHub vscode#241546](https://github.com/microsoft/vscode/issues/241546) — `picked` behavior can be surprising); `showQuickPick` does not render per-item `QuickPickItem.buttons` ([VERIFIED: `@types/vscode`]). |
| **UXP-03** | UI surfaces the **resolved baseline name** (or explicit fallback label) so merge indicators are interpretable. | `plan.baseline.displayLabel` from `buildCleanupRunPlan`; surface in `title` / `placeHolder` (`QuickPickOptions`) or `QuickPick.title` / `QuickPick.placeholder` (`createQuickPick`) ([VERIFIED: `@types/vscode`]). |

</phase_requirements>

## Summary

Phase 4 wires **`buildCleanupRunPlan`** output into native **`vscode.window`** QuickPick: one row per **`CleanupCandidateRow`**, **`ResolvedBaseline.displayLabel`** visible in picker chrome, merge state via **`ThemeIcon` + `detail`**, deterministic sort (**merged → not_merged → unknown**, then A–Z). The command must remain a **no-op for Git mutations** on cancel/dismiss and must **not** perform deletion (Phase 5).

**Primary recommendation:** Prefer **`vscode.window.showQuickPick`** with **`canPickMany: true`**, **`title`** and **`placeHolder`** carrying baseline text, and **`QuickPickItem`** rows using **`label`** = branch short name, **`detail`** = plain-language merge vs baseline, **`iconPath`** = `new vscode.ThemeIcon(...)`. Reserve **`createQuickPick`** only if you need **per-item buttons**, **top-level `buttons`**, or **manual accept/hide** timing that `showQuickPick` cannot express ([CITED: VS Code Extension API — `createQuickPick` note](https://code.visualstudio.com/api/references/vscode-api#window.createQuickPick)).

## Project Constraints (from .cursor/rules/)

**None found** — `.cursor/rules/` is not present in this workspace. Product constraints from `CLAUDE.md` / `PROJECT.md` still apply: **vscode.git API** for Git data, **esbuild** + **`tsc --noEmit`**, **safety-first** (non-destructive defaults, clear errors).

## Standard Stack

### Core

| Library / surface | Version | Purpose | Why standard |
|-------------------|---------|---------|----------------|
| **VS Code Extension API** (`vscode`) | `engines.vscode`: **`^1.96.0`** (repo) | QuickPick, `ThemeIcon`, commands | Contract with the editor; QuickPick is the native review surface ([VERIFIED: `package.json`]). |
| **`@types/vscode`** | **`~1.96.0`** (repo); npm **latest 1.115.0** is newer major line — keep aligned with `engines` for publishing | Typings for `window.showQuickPick` / `createQuickPick` | vsce expects typings not to exceed declared engine API ([CITED: `CLAUDE.md` / vsce discussion]). |
| **`vscode.git` + `buildCleanupRunPlan`** | n/a | Source of `CleanupCandidateRow` + `ResolvedBaseline` | Already the integration point ([VERIFIED: `src/git/cleanupRun.ts`, `src/extension.ts`]). |

### Supporting

| Library | Version | Purpose | When to use |
|---------|---------|---------|-------------|
| **Vitest** | **`^4.1.4`** (lockfile range); registry **4.1.4** [VERIFIED: npm registry] | Unit tests for **pure** sort/map helpers if extracted from `vscode` | Optional; Extension Host not required for sort-only tests ([VERIFIED: `package.json`, `vitest.config.mts`]). |

### Alternatives considered

| Instead of | Could use | Tradeoff |
|------------|-----------|----------|
| `showQuickPick` | `createQuickPick` | More control (buttons, progressive loading); more boilerplate (`show`, `onDidAccept`, `onDidHide`, `dispose`). |
| `detail` for merge sentence | `description` only | `detail` is a separate line — better for longer baseline-specific copy per **D-02** / UI-SPEC. |

**Installation:** No new packages required for Phase 4 unless you add a small test-only module (Vitest already present).

**Version verification (2026-04-14):**

```text
npm view vitest version   → 4.1.4
npm view @types/vscode version → 1.115.0 (project pins ~1.96.0 intentionally)
```

## Architecture Patterns

### Recommended flow (command handler)

```
resolveRepository → buildCleanupRunPlan → map+sort rows → QuickPick → return selected branch names (or early exit)
```

- **Baseline errors:** Keep existing **`BaselineResolutionError`** path — **no** QuickPick ([VERIFIED: `04-UI-SPEC.md`, `extension.ts` pattern]).
- **Zero candidates:** Show **`showInformationMessage`** / **`showWarningMessage`** per UI-SPEC; **no** `deleteBranch`; dismiss = no-op.
- **Phase 5 hook:** Export a clear result type, e.g. `readonly string[] | undefined` where `undefined` = cancelled, `[]` = accepted with nothing selected (exact semantics: validate in UAT — see Open Questions).

### Sorting (**D-04**)

Implement a pure comparator or ordered buckets:

1. `merge` order: `merged` (0) → `not_merged` (1) → `unknown` (2)  
2. Tie-break: `localeCompare` on **`branch.name`** (short name from `LocalBranchSummary`)

Consider extracting **`sortCleanupCandidatesForReview(rows): CleanupCandidateRow[]`** under `src/` for **Vitest** coverage (no `vscode` import).

### Row mapping: `CleanupCandidateRow` → `QuickPickItem`

| `QuickPickItem` field | Source / rule |
|----------------------|---------------|
| `label` | `row.branch.name` (**D-03**) |
| `detail` | Plain language + **`plan.baseline.displayLabel`** (**D-02**) |
| `iconPath` | `new vscode.ThemeIcon('<codicon-id>')` (**D-01**) — ids discretionary |
| `description` | Optional short tag; UI-SPEC emphasizes **detail** for merge sentence — avoid duplicating long text unless needed |

Attach **stable identity** for round-trip: use a **`QuickPickItem` subtype** (e.g. `{ branchName: string } & vscode.QuickPickItem`) or a side `Map` from `label` → row if names are guaranteed unique among candidates ([ASSUMED]: candidate branch names are unique within the list — validate against `DOM-02`/candidate rules).

### Anti-patterns

- **Calling `Repository.deleteBranch` in Phase 4:** violates phase boundary and **SAFE-*** deferral; grep CI/UAT should fail if introduced.
- **Icon-only merge state:** violates **D-02** / accessibility note in UI-SPEC.
- **Relying on pre-notification alone for baseline:** violates **D-05** / **UXP-03** default.
- **Labeling primary action “Delete selected” in Phase 4:** implies deletion in this phase; prefer **Continue** / **Next** / **Review complete** style until Phase 5 implements delete ([ASSUMED]: exact label is discretion).

## Don't Hand-Roll

| Problem | Don't build | Use instead | Why |
|---------|-------------|-------------|-----|
| Modal branch review in **Webview** for v1 | Custom tree + webview | `showQuickPick` / `createQuickPick` | UI-SPEC and **UXP-10** defer richer UI; QuickPick is sufficient contract. |
| Merge/baseline computation in UI layer | Re-derive merge in picker | `buildCleanupRunPlan` | Single source of truth for **DOM-04** alignment with future delete policy. |
| Git reads from UI | `child_process` git in command | Existing `vscode.git` + domain pipeline | Locked product architecture. |

**Key insight:** Keep **all classification** in the plan builder; the UI only **sorts, labels, and collects selection**.

## Common Pitfalls

### Pitfall 1: `showQuickPick` vs `createQuickPick` — feature mismatch

**What goes wrong:** Choosing `showQuickPick` then needing **per-item** or **toolbar** buttons (not supported — item `buttons` only with `createQuickPick` per API).  
**Why:** API explicitly states item buttons are **not** rendered for `showQuickPick` ([VERIFIED: `node_modules/@types/vscode/index.d.ts` — `QuickPickItem.buttons` doc]).  
**How to avoid:** Use `showQuickPick` for Phase 4 v1; if product adds “pin” / row actions before Phase 5, migrate to `createQuickPick`.  
**Warning signs:** UX asks for row-level actions or custom title-bar actions.

### Pitfall 2: `picked` / initial selection vs **UXP-02**

**What goes wrong:** Pre-checking all merged branches; users confirm without conscious per-row review.  
**Why:** GitHub reports `picked` not always honored as expected in some flows ([CITED: vscode#241546](https://github.com/microsoft/vscode/issues/241546)).  
**How to avoid:** Default **no** pre-selection for anything that will flow to delete in Phase 5; force explicit Space/click per row.  
**Warning signs:** “One Enter deletes everything” anxiety in UAT.

### Pitfall 3: **`createQuickPick` + item list refresh**

**What goes wrong:** Updating `items` leaves stale `selectedItems`.  
**Why:** Known QuickPick selection persistence when items change ([CITED: vscode#75046](https://github.com/microsoft/vscode/issues/75046)).  
**How to avoid:** If you mutate `items`, assign `selectedItems = []` or rebuild selection intentionally.  
**Warning signs:** Phase 5 adds refresh mid-picker.

### Pitfall 4: Cancel vs accept — `undefined` vs `[]`

**What goes wrong:** Treating “OK with zero picks” as cancel or vice versa; double-invoking downstream.  
**Why:** API return type is `T[] | undefined` for `canPickMany: true` ([VERIFIED: `@types/vscode`]); runtime distinction between dismiss and accept-with-empty should be validated on target **1.96+**.  
**How to avoid:** Document chosen semantics in PLAN; add UAT step; if ambiguous, prefer **`createQuickPick`** and treat only `onDidHide` + internal “accepted” flag.

### Pitfall 5: “Delete all” / bulk shortcut copy

**What goes wrong:** Button or command title implies deleting every candidate without multi-select.  
**Why:** **UXP-02** explicit review requirement.  
**How to avoid:** No “Select all candidates for deletion” command in Phase 4; primary confirmation must not read as bulk delete ([ASSUMED]: VS Code may offer generic multi-select keybindings — acceptable if product still requires explicit row selection + Phase 5 confirmation; confirm in UAT).

### Pitfall 6: Empty candidate list

**What goes wrong:** Showing an empty QuickPick confuses users (“is it broken?”).  
**Why:** UI-SPEC asks for a **message** and no mutations.  
**How to avoid:** `showInformationMessage` with clear copy (“No cleanup candidates…”) and `return`.

## Code Examples

Verified patterns from **`@types/vscode`** / VS Code API docs:

### Multi-select `showQuickPick` with title + baseline in chrome

```typescript
import * as vscode from 'vscode';

type BranchPick = vscode.QuickPickItem & { readonly branchName: string };

const picks: BranchPick[] = /* sorted mapped candidates */;

const chosen = await vscode.window.showQuickPick(picks, {
  canPickMany: true,
  title: `Branch Cleaner — baseline: ${plan.baseline.displayLabel}`,
  placeHolder: `Select branches to include for the next step (baseline ${plan.baseline.displayLabel})`,
  matchOnDetail: true,
});

if (chosen === undefined) {
  return; // UXP-01: cancel / dismiss — no mutations
}

const selectedNames = chosen.map((c) => c.branchName);
// Phase 5 consumes selectedNames; Phase 4 does not delete.
```

Source: [CITED: VS Code API Reference — window.showQuickPick](https://code.visualstudio.com/api/references/vscode-api#window.showQuickPick); [VERIFIED: `QuickPickOptions` in `node_modules/@types/vscode/index.d.ts`]

### Row icon (`ThemeIcon`)

```typescript
const icon =
  row.merge === 'merged'
    ? new vscode.ThemeIcon('pass') // example only — final ids: discretion
    : row.merge === 'not_merged'
      ? new vscode.ThemeIcon('error')
      : new vscode.ThemeIcon('question');
```

Source: [VERIFIED: `QuickPickItem.iconPath` + `ThemeIcon` in `node_modules/@types/vscode/index.d.ts`]

### `createQuickPick` when flexibility is required

```typescript
const qp = vscode.window.createQuickPick<BranchPick>();
qp.canSelectMany = true;
qp.title = `Branch Cleaner — ${plan.baseline.displayLabel}`;
qp.placeholder = 'Select branches…';
qp.items = picks;
qp.show();
qp.onDidAccept(() => {
  const selected = qp.selectedItems;
  qp.hide();
  // handle selected — then dispose in onDidHide
});
```

Source: [CITED: VS Code API Reference — window.createQuickPick](https://code.visualstudio.com/api/references/vscode-api#window.createQuickPick); [VERIFIED: `QuickPick` interface in `@types/vscode`]

## State of the Art

| Old approach | Current approach | When changed | Impact |
|--------------|------------------|--------------|--------|
| Information-only toast after plan | Multi-select QuickPick review | Phase 4 | Meets **UXP-01–03**; aligns with gitcleaner-style review. |
| Rich webview picker (**UXP-10**) | Deferred | v2 | Less implementation cost for v1. |

**Deprecated/outdated:** Relying on **`picked`** for critical default selection without manual verification on your pinned VS Code — treat as fragile ([CITED: vscode#241546](https://github.com/microsoft/vscode/issues/241546)).

## Assumptions Log

| # | Claim | Section | Risk if wrong |
|---|-------|---------|---------------|
| A1 | `showQuickPick` with `canPickMany` resolves to `undefined` on Esc and to `[]` when user accepts with zero items selected (vs `undefined`) | Pitfall 4 / Open Questions | Wrong downstream “cancel” handling |
| A2 | Candidate `branch.name` values are unique within a single plan | Row mapping | Wrong branch resolved from pick |
| A3 | No built-in QuickPick control in 1.96+ violates **UXP-02** without extension-authored copy | Pitfall 5 | Product/regression risk — UAT |

## Open Questions

1. **Accept with zero selection vs cancel — exact `showQuickPick` return values on VS Code 1.96.x**  
   - *What we know:* Typing is `T[] | undefined` ([VERIFIED: `@types/vscode`]).  
   - *What's unclear:* Whether “OK” with zero picks yields `[]` or `undefined` in all dismissal paths.  
   - *Recommendation:* Manual UAT on minimum supported VS Code; if ambiguous, use **`createQuickPick`** and explicit accept handler.

2. **Should merged rows be visually grouped with separators (`QuickPickItemKind.Separator`)?**  
   - *What we know:* API supports separators ([VERIFIED: `QuickPickItemKind`]).  
   - *What's unclear:* Whether separators improve scan enough to justify extra complexity vs sort-only (**D-04**).  
   - *Recommendation:* v1 = sort only; separators = polish if cramped ([ASSUMED] preference).

## Environment Availability

| Dependency | Required by | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| **VS Code / Cursor** | QuickPick UAT | ✓ (dev machine) | **≥ 1.96** per `engines` | None for faithful UAT |
| **Built-in Git extension** | `getGitApi` / `Repository` | ✓ when declared `extensionDependencies` | — | Error path already exists |
| **System Git** | vscode.git backend | ✓ typical dev env | — | GIT-03 style errors |
| **Node (dev)** | `npm run compile`, Vitest | ✓ | v22.11.0 observed | — |

**Missing dependencies with no fallback:** None for code-only Phase 4.

**Step 2.6 note:** No external services beyond editor + local repo.

## Validation Architecture

> `workflow.nyquist_validation` is **enabled** in `.planning/config.json` ([VERIFIED: `.planning/config.json`]).

### Test framework

| Property | Value |
|----------|-------|
| Framework | **Vitest** `^4.1.4` ([VERIFIED: `package.json` + npm]) |
| Config file | `vitest.config.mts` |
| Quick run | `npm run test:unit` |
| Full suite | Same as quick (only unit tests today) |

### Phase requirements → test map

| Req ID | Behavior | Test type | Automated command | File / check |
|--------|----------|-----------|---------------------|----------------|
| **UXP-01** | Cancel/dismiss → **no** `deleteBranch`, no repo mutation | Manual UAT + static grep | `rg "deleteBranch" src/extension.ts src/git` — expect **no matches** in command path after Phase 4 ([VERIFIED: currently no `deleteBranch` in `src`]) | Manual in Extension Development Host |
| **UXP-02** | No v1 “delete all” shortcut; explicit multi-select | Manual UAT + code review | Inspect contributed command titles / QuickPick button labels | `package.json` contributes + picker code |
| **UXP-03** | Baseline visible for whole review | Manual UAT | Visual: title/placeholder contains `plan.baseline.displayLabel` | `extension.ts` / extracted UI module |
| **D-04** | Sort order | Unit (optional) | `npm run test:unit -- <file>` | New `*.test.ts` if pure `sort*` helper extracted |
| **D-01–D-03** | Icons + detail + short name label | Manual UAT | — | Theme contrast + screen reader spot-check |

### Sampling rate

- **Per task commit:** `npm run check-types` (existing) + `npm run test:unit` when tests touch changed files.  
- **Per wave merge:** `npm run test:unit` + manual smoke of **Cleanup Branches** command.  
- **Phase gate:** UXP checklist in `04-UI-SPEC.md` “Checker sign-off” + no `deleteBranch` in Phase 4 paths.

### Wave 0 gaps

- [ ] Optional **`src/**/cleanupReviewPick.test.ts`** — deterministic sort + string templates if logic extracted from `vscode` API.  
- [ ] **Manual UAT script** in phase verification doc (copy/paste steps): open repo → run command → verify baseline in title → multi-select → Esc → confirm no side effects.  
- [ ] **Grep gate:** `rg "deleteBranch|force.*delete" src` for Phase 4 PR (allowlist only `src/types/git.d.ts` if needed).

*(If no unit tests added: Phase 4 remains **manual-UAT-heavy** — acceptable per QuickPick being editor-native.)*

### Manual UAT steps (UXP-01 — UXP-03)

1. Open a workspace with a Git repo and ≥1 cleanup candidate (per Phase 3 rules).  
2. Run **Git: Cleanup Branches** (`branchCleaner.cleanupBranches`).  
3. **UXP-03:** Confirm **title** and/or **placeholder** shows **`plan.baseline.displayLabel`** for the entire picker session (not only a prior notification).  
4. **UXP-01:** Press **Esc** / click away (if not `ignoreFocusOut`) — confirm **no** branches deleted (inspect `git branch` / VS Code SCM).  
5. **UXP-01:** Select one or more rows, press **Enter** — Phase 4 should still perform **no deletion** (confirm `git branch` unchanged).  
6. **UXP-02:** Confirm UI has **no** “delete all” / “select all for deletion” affordance; merged items are not all pre-checked in a way that allows one-key destructive flow.  
7. **Empty list:** Repo with **zero** candidates → information message path, **no** mutations.  
8. **D-04:** Eyeball order: merged block → not merged → unknown; alphabetical within block.  
9. **D-01–D-02:** Each row shows **icon** + **detail** sentence referencing the same baseline.

## Security Domain

Phase 4 is **local UI + Git read path** only; no network calls or secrets introduced by the picker itself.

### Applicable ASVS categories (lightweight)

| ASVS category | Applies | Standard control |
|---------------|---------|-------------------|
| V5 Input validation | Low | Branch names come from **`vscode.git`** / plan builder, not free-form user text into shell. |
| Others (V2–V4, V6–V14) | No / negligible | N/A for QuickPick wiring without deletion or remote operations. |

### Known threat patterns

| Pattern | STRIDE | Mitigation |
|---------|--------|------------|
| Accidental destructive action | Elevation of privilege (user harm) | **No `deleteBranch` in Phase 4**; explicit selection only; cancel = no-op. |
| Misleading merge UI | Spoofing / tampering (trust) | Keep **detail** text tied to **`plan.baseline.displayLabel`** and same `merge` enum as Phase 3. |

## Sources

### Primary (HIGH)

- [VERIFIED: `node_modules/@types/vscode/index.d.ts`] — `QuickPickItem`, `QuickPickOptions`, `showQuickPick` overloads, `createQuickPick`, `QuickPick`, `QuickInput.title`, item `buttons` limitation.  
- [CITED: https://code.visualstudio.com/api/references/vscode-api#window.showQuickPick](https://code.visualstudio.com/api/references/vscode-api#window.showQuickPick) — official API reference (same page family as `createQuickPick`).  
- [VERIFIED: `package.json`, `src/extension.ts`, `src/git/cleanupRun.ts`, `src/domain/types.ts`] — integration and types.  
- [VERIFIED: `.planning/phases/04-cleanup-review-ui/04-UI-SPEC.md`, `.planning/REQUIREMENTS.md`] — contract + requirement IDs.

### Secondary (MEDIUM)

- [CITED: https://github.com/microsoft/vscode/issues/241546](https://github.com/microsoft/vscode/issues/241546) — `picked` / selection behavior caveats.  
- [CITED: https://github.com/microsoft/vscode/issues/75046](https://github.com/microsoft/vscode/issues/75046) — `selectedItems` when `items` updates (`createQuickPick`).

### Tertiary (LOW)

- Historical typing discussion [vscode#64014](https://github.com/microsoft/vscode/issues/64014) — largely superseded by current overloads; do not drive architecture.

## Metadata

**Confidence breakdown:**

- Standard stack: **HIGH** — pinned `engines` + local `@types/vscode` read.  
- Architecture: **HIGH** — UI-SPEC + existing plan builder are explicit.  
- Pitfalls: **MEDIUM** — editor UX edge cases need UAT on pinned VS Code.

**Research date:** 2026-04-14  
**Valid until:** ~2026-05-14 (re-check if bumping `engines.vscode` or changing picker API usage)

## RESEARCH COMPLETE
