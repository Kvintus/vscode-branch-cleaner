# Phase 3: Domain — candidates, baseline, merge - Research

**Researched:** 2026-04-14  
**Domain:** VS Code extension + **vscode.git** `Repository` API, Git merge-base / ancestry semantics, gitcleaner-style branch cleanup rules  
**Confidence:** **HIGH** for API shapes and Git ancestry definition (vendored `git.d.ts` + official Git docs); **MEDIUM** for runtime-only upstream fields (“gone”) not present in pinned typings

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Implementation Decisions**

**Candidate selection (DOM-01, DOM-02)**

- **D-01:** A local branch is a **candidate** iff it is **not** the **current HEAD branch** (by short name match to `repository.state.HEAD`) and it matches **gitcleaner-style abandonment**: **no upstream**, or upstream metadata indicates **missing / invalid / “gone”** remote tracking (exact fields follow `LocalBranchSummary` / `git.d.ts` as implemented in Phase 2—predicate lives in domain and is unit-tested with fixture structs).
- **D-02:** **Detached HEAD** / unnamed current branch: treat **no branch name** as current; only named locals that pass the abandonment predicate are candidates (never invent a “current” synthetic name).
- **D-03:** Branches that **only** fail the candidate predicate (e.g. healthy tracking) are **out of scope** for the candidate list in v1—no second bucket in domain beyond “candidate vs not” unless planning adds an explicit non-goal.

**Baseline resolution (DOM-03)**

- **D-04:** Each cleanup run computes **one** `ResolvedBaseline` object: **display label** (for later UXP-03) + **ref identity** used for merge checks. **Primary:** follow **`origin/HEAD`** when the symref `refs/remotes/origin/HEAD` resolves to a remote branch under `origin`. **Fallback order (fixed, documented in code + README fragment during implementation):** (1) `refs/remotes/origin/main`, (2) `refs/remotes/origin/master`, (3) if `origin` exists but none of the above resolve: **first** `refs/remotes/origin/*` head ref in stable sort order **excluding** `HEAD`—only as last resort; (4) if no usable remote baseline: domain/run layer returns a **structured error** (“cannot resolve default branch”) rather than silently picking a random local—user-visible message wording is integration, but the **contract** is “no baseline ⇒ no merge labels / no delete eligibility for this run.”
- **D-05:** **v2 `CFG-01`** (settings override) is **out of scope** for Phase 3—no settings read in domain module; overrides are deferred.

**Merge labeling (DOM-04, pitfalls alignment)**

- **D-06:** **“Merged”** means: the candidate branch’s **tip commit** is **reachable from** the baseline tip (**ancestor** semantics), consistent with “no unique commits on the branch relative to integration tip.” Use **`Repository.getMergeBase`** (or equivalent API) to implement the check as recommended by vendored `git.d.ts` / runtime behavior—**not** `git branch --merged` CLI. If the API reports inability to compare, surface **unknown / error** state for that row rather than guessing.
- **D-07:** **Squash / rebase merge expectation mismatch** (see `.planning/research/PITFALLS.md`): product stance for v1 is **Git-ancestor merged** only; no special “squash-aware” label in Phase 3. Document in planner/UX copy follow-up for Phase 4 tooltip if needed.

**Structure, tests, and integration (QUAL-01)**

- **D-08:** Add a **`src/domain/`** (or similarly named) module for **pure** functions: e.g. `isCandidate(...)`, `orderBaselineFallbacks(...)` on **plain data** types decoupled from `vscode` where possible. **Merge** classification may call `Repository` in a thin **adapter** in `src/git/` if pure graph is impractical; **unit tests** must cover at minimum **candidate predicates** and **fallback ordering / resolution helpers** with fixtures; merge wrapper tests use **mocked** `getMergeBase` / ref maps where feasible.
- **D-09:** **Vitest** (already in stack research) is acceptable for Node-isolated domain tests per project stack guidance; keep Extension Host tests separate.

### Claude's Discretion

- Exact file split (`candidates.ts` / `baseline.ts` / `merge.ts` vs single `cleanupDomain.ts`).
- Whether baseline resolution lives entirely in `src/git/` with domain importing types only, vs one `resolveBaselineForRun(repository)` next to domain—planner chooses as long as contracts in D-04–D-06 hold.

### Deferred Ideas (OUT OF SCOPE)

- **Settings-based baseline override** (**CFG-01**) — v2.
- **“Refresh origin/HEAD”** helper action — nice-to-have; not required for Phase 3 domain closure.
- **Worktree-aware delete hints** — primarily Phase 5 / Phase 4 messaging; domain may only expose branch names for now.

### Reviewed Todos (not folded)

- None.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DOM-01 | Candidate set matches gitcleaner-style intent (abandoned / missing-remote-tracking), not all locals | Pure `isCandidate` / `classifyBranch` on `LocalBranchSummary` + `currentHeadName` fixtures; align abandonment rules with pinned `git.d.ts` fields |
| DOM-02 | Current branch never in candidate list | Fixtures: named HEAD match, detached HEAD (`HEAD` undefined or no `name`), edge case same short name normalization as `repository.state.HEAD` |
| DOM-03 | Merge comparison uses `origin/HEAD` default with documented fallback when missing/unusable | `getRefs` + symref resolution helpers (pure), stable sort for `refs/remotes/origin/*`; structured error on total failure per D-04 |
| DOM-04 | Each candidate merged vs not merged vs **same** `ResolvedBaseline` | Single baseline object per run; merge adapter calls `getMergeBase(baselineRef, branchTipOrRef)` and maps to ancestor predicate; per-row unknown on API failure |
| QUAL-01 | Automated tests for pure domain (candidates + merge/baseline classification) with fixtures | Vitest in Node (see **Validation Architecture**); mock `Repository` slice for merge tests |

</phase_requirements>

## Summary

Phase 3 closes the **domain contract** between Phase 2’s **`LocalBranchSummary`** read model and later UI/delete phases: **who is a candidate**, **one integration baseline per run**, and **one merge signal per candidate** against that baseline. Locked decisions require **ancestor-style “merged”** via **`Repository.getMergeBase`**, **`origin/HEAD`**-first baseline with a **fixed fallback ladder** and **hard failure** if no remote baseline exists, and **Vitest-backed** pure functions for predicates and ordering.

**Primary recommendation:** Implement **`src/domain/`** with **DTO-in / DTO-out** pure functions (candidates + baseline resolution from **ref snapshots**), plus **`src/git/mergeClassification.ts`** (or similar) that adapts `Repository.getMergeBase` and throws/returns a **typed “no baseline” error** at the orchestration boundary; test predicates and baseline ordering entirely in Vitest with **fixtures**, and merge classification with **mocks** of `getMergeBase`.

## Project Constraints (from .cursor/rules/)

**None** — `.cursor/rules/` is not present in this workspace `[VERIFIED: workspace glob]`.

**Stack guidance (CLAUDE.md / project research):** Prefer **vscode.git** `Repository` for Git operations; use **Vitest** for **Node-isolated** pure logic tests; keep **Extension Host** tests separate `[CITED: CLAUDE.md / .planning/research/STACK.md]`.

## Standard Stack

### Core

| Library / surface | Version | Purpose | Why Standard |
|-------------------|---------|---------|--------------|
| **vscode.git** `Repository` | API **v1** via `getAPI(1)` | `getBranches`, `getRefs`, `getMergeBase`, `state.HEAD` | Project decision; same abstraction as built-in Git UI `[CITED: src/types/git.d.ts]` |
| **TypeScript** | `6.0.2` (project pin) | Types for domain + adapters | Already in `package.json` `[VERIFIED: package.json]` |
| **Vitest** | `4.1.4` | Unit tests for `src/domain/**` without loading `vscode` | Stack research + optional second runner per Microsoft extension guidance `[VERIFIED: npm registry]` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none required) | — | Domain fixtures are plain objects | If tests need deep partial mocks, consider `vi.fn()` only (built into Vitest) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `getMergeBase` | Raw `git merge-base` CLI | Violates Phase 2/3 “vscode.git first”; duplicates Git extension behavior |
| Vitest | Mocha for domain only | Project already documents Vitest for pure logic; Mocha remains for `@vscode/test-cli` EH tests later |

**Installation (Wave 0):**

```bash
npm install -D vitest@4.1.4
```

**Version verification:**

- `vitest`: **4.1.4**, `time.modified` **2026-04-09** `[VERIFIED: npm registry]`

## Architecture Patterns

### Recommended Project Structure

```
src/
├── domain/                 # Pure: candidates, baseline ordering, types (no vscode import)
│   ├── candidates.ts       # isCandidate, filterCandidates (example split)
│   ├── baseline.ts         # resolveBaselineFromRemoteRefs, fallback order
│   ├── mergeSemantics.ts   # merged = ancestor (pure helper using merge base + tip hashes)
│   └── types.ts            # ResolvedBaseline, BaselineResolutionError, MergeLabel
├── git/
│   ├── branches.ts         # Existing listLocalBranches
│   ├── baselineAdapter.ts  # getRefs snapshot → domain input (optional split)
│   └── mergeAdapter.ts     # Thin: calls repository.getMergeBase, maps errors → unknown
```

Planner may collapse files per **Claude's Discretion** as long as boundaries stay testable.

### Pattern 1: Ancestor “merged” via merge base

**What:** Git documents: *A is an ancestor of B* iff `merge-base(A, B)` equals **A** (equivalently `git merge-base --is-ancestor A B`). For “branch **merged into** integration”, interpret as: **candidate tip** is **ancestor of baseline tip** (all candidate commits contained in integration history) `[CITED: https://git-scm.com/docs/git-merge-base]`.

**When to use:** Every DOM-04 label for v1; aligns with **PITFALLS.md** Critical Pitfall 1.

**Example (pure, after adapter supplies commit OIDs):**

```typescript
// Source: https://git-scm.com/docs/git-merge-base (discussion: ancestor idiom)
export function isMergedAncestor(
  candidateTipOid: string,
  baselineTipOid: string,
  mergeBaseOid: string | undefined,
): 'merged' | 'not_merged' | 'unknown' {
  if (!mergeBaseOid) {
    return 'unknown';
  }
  return mergeBaseOid === candidateTipOid ? 'merged' : 'not_merged';
}
```

**Note:** `Repository.getMergeBase(ref1, ref2)` returns `Promise<string | undefined>` per vendored API `[CITED: src/types/git.d.ts]`. Pass **unambiguous refs** (full `refs/heads/*` / `refs/remotes/origin/*`) per **PITFALLS.md** Pitfall 6.

### Pattern 2: Baseline from ref snapshot (local-first)

**What:** Use **`repository.getRefs({ remote: true, ... })`** (or equivalent query) to build a map of `refs/remotes/origin/*` **without network** — aligns with PITFALLS Pitfall 9 (avoid implicit `git remote show` during cleanup v1) `[CITED: src/types/git.d.ts getRefs; CITED: .planning/research/PITFALLS.md]`.

**When to use:** Resolving `origin/HEAD` symref target and applying **D-04** fallback order on that snapshot.

### Anti-Patterns to Avoid

- **`git branch --merged` as the merge source of truth:** Contradicts locked D-06 and misaligns baseline vs UI `[CITED: 03-CONTEXT.md D-06]`.
- **Silent fallback to local `main`:** Contradicts D-04 (structured error if no remote baseline).
- **Per-candidate baseline recomputation:** Breaks DOM-04 consistency; compute **once** per run.
- **Treating squash-merge as “merged”:** Explicitly out of scope for v1 label semantics (D-07); document expectation for Phase 4 copy.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Merge closeness / ancestry | String compares on branch names | `getMergeBase` + tip OIDs | Correct graph semantics; handles merges, duplicates `[CITED: git-merge-base]` |
| Remote ref listing | Shell `git for-each-ref` | `Repository.getRefs` | Keeps Git orchestration inside vscode.git `[CITED: src/types/git.d.ts]` |
| “Merged” for safety | Heuristic on `ahead`/`behind` only | Ancestor check on commits | Ahead/behind does not imply merged into baseline |

**Key insight:** Domain complexity is in **correct Git graph meaning** and **baseline stability**, not in novel algorithms—delegate graph questions to the same primitive Git uses (`merge-base`).

## Common Pitfalls

### Pitfall 1: Wrong merge baseline (false merged / false not merged)

**What goes wrong:** Labels disagree with `git log` / user expectation; worst case, unsafe delete in later phases.  
**Why it happens:** Stale `origin/main`, wrong ref, or comparing short ambiguous names.  
**How to avoid:** One **`ResolvedBaseline`** per run (D-04); full refnames; document squash/rebase limitation (D-07) `[CITED: .planning/research/PITFALLS.md §1]`.  
**Warning signs:** User reports branch “merged” but unique commits still on branch relative to chosen tip.

### Pitfall 2: Missing or stale `origin/HEAD`

**What goes wrong:** Wrong default or noisy errors.  
**Why it happens:** Remote may not advertise symref; renamed default.  
**How to avoid:** Implement **exact** fallback ladder D-04; surface **which ref** won in `ResolvedBaseline` for Phase 4 (UXP-03) `[CITED: .planning/research/PITFALLS.md §2]`.

### Pitfall 3: `getMergeBase` returns `undefined` / throws

**What goes wrong:** Silent “not merged” or silent “merged”.  
**Why it happens:** Shallow clone, corrupt repo, unrelated histories.  
**How to avoid:** Map to **`unknown`** (or row-level error) per D-06; optionally detect shallow in later hardening (PITFALLS §4) — not required in CONTEXT but planner should not overclaim confidence `[CITED: 03-CONTEXT.md D-06; CITED: PITFALLS.md §4]`.

### Pitfall 4: Upstream “gone” not in pinned `UpstreamRef` type

**What goes wrong:** Candidate predicate misses real gitcleaner cases or over-filters.  
**Why it happens:** `src/types/git.d.ts` shows `upstream?: { remote; name; commit? }` only — no `gone` boolean `[CITED: src/types/git.d.ts]`.  
**How to avoid:** At implementation, compare **runtime** `Branch` objects from `getBranches` with documentation; if “gone” is only inferable (e.g. missing remote ref + upstream set), encode that explicitly and add fixtures `[ASSUMED: runtime fields may exceed vendored typings]`.

## Code Examples

### `Repository` surfaces used by this phase

```246:246:src/types/git.d.ts
	getMergeBase(ref1: string, ref2: string): Promise<string | undefined>;
```

```238:244:src/types/git.d.ts
	getBranches(query: BranchQuery, cancellationToken?: CancellationToken): Promise<Ref[]>;
	getBranchBase(name: string): Promise<Branch | undefined>;
	setBranchUpstream(name: string, upstream: string): Promise<void>;

	getRefs(query: RefQuery, cancellationToken?: CancellationToken): Promise<Ref[]>;
```

### Phase 2 input DTO (domain input)

```7:17:src/git/branches.ts
export interface LocalBranchSummary {
  readonly name: string;
  readonly commit?: string;
  readonly upstream?: {
    readonly remote: string;
    readonly name: string;
    readonly commit?: string;
  };
  readonly ahead?: number;
  readonly behind?: number;
}
```

### Current HEAD access (candidate exclusion)

```115:118:src/types/git.d.ts
export interface RepositoryState {
	readonly HEAD: Branch | undefined;
	readonly refs: Ref[];
```

Match **candidate short `name`** to **`repository.state.HEAD?.name`** per D-01/D-02; detached ⇒ no named current branch for exclusion purposes.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `git branch --merged` without fixed baseline | `origin/HEAD` + fallbacks + `merge-base` ancestry | Project Phase 3 lock | Predictable “integration” meaning |
| CLI `for-each-ref` in extension | `Repository.getRefs` / `getBranches` | Phase 2+ architecture | Consistent with built-in Git extension |

**Deprecated/outdated:** Using only local `HEAD` as merge target for cleanup — superseded by **`origin/HEAD`** product decision `[CITED: .planning/PROJECT.md, 03-CONTEXT.md]`.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Runtime `Branch` / upstream may expose or imply “gone” beyond vendored `UpstreamRef` | Pitfall 4 | Wrong candidate set until runtime verified |
| A2 | `getMergeBase(ref1, ref2)` is symmetric enough that `mergeBase(candidate, baseline)` equals candidate tip OID when candidate ⊆ baseline history | Pattern 1 | Rare topology edge cases — treat `unknown` if ambiguous |

## Open Questions (RESOLVED)

1. **Exact abandonment signal for “gone” with only `LocalBranchSummary` fields** — **RESOLVED**
   - **What we know:** D-01 requires no upstream or missing/invalid/gone tracking; Phase 2 typed summary mirrors `git.d.ts` `[CITED: 03-CONTEXT.md, src/git/branches.ts]`.
   - **Resolution for planning:** Treat **no upstream** as abandoned; treat **upstream present but `commit` missing** after a successful `listLocalBranches` read as **abandoned / unknown-remote** for candidate purposes (conservative: still a candidate). Refine with `getRefs` existence checks in the adapter phase if needed — tracked in plan tasks, not blocking.
   - **Recommendation (execution):** Prefer `getRefs` for remote-tracking existence when implementing “gone” edge cases; document chosen predicate in `src/domain/candidates.ts` header.

2. **`getMergeBase` argument order / ref string format** — **RESOLVED**
   - **What we know:** API accepts `string` treeish `[CITED: src/types/git.d.ts]`.
   - **Resolution for planning:** **Order:** `getMergeBase(refA, refB)` is symmetric for merge-base purposes; plans standardize on **`getMergeBase(baselineRef, candidateRef)`**. **Refs:** always pass **full** `refs/heads/*` and `refs/remotes/*` strings from `getRefs` / `getBranches` outputs (per D-06 / CONTEXT).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | Vitest + `tsc` | ✓ (dev) | Project `engines.node` `>=20` `[VERIFIED: package.json]` | — |
| VS Code + built-in Git | Manual smoke of adapters | ✓ (author machine) | `^1.96.0` engine | Extension Host tests in later phases |
| `vitest` package | QUAL-01 | ✗ in repo today | — | **Wave 0:** `npm install -D vitest@4.1.4` |

**Missing dependencies with no fallback:**

- **Vitest** not listed in `package.json` — blocks automated QUAL-01 until installed `[VERIFIED: package.json]`.

**Missing dependencies with fallback:**

- None once Vitest is added.

**Step 2.6 note:** No external services; domain is code-only. Shallow-clone degradation remains a **product** follow-up (PITFALLS), not an install dependency.

## Validation Architecture

> `workflow.nyquist_validation` is **true** in `.planning/config.json` `[VERIFIED: .planning/config.json]`.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | **Vitest** `4.1.4` (to be added) `[VERIFIED: npm registry]` |
| Config file | `vitest.config.ts` (recommended) or `defineConfig` in `package.json` — **none yet** |
| Quick run command | `npx vitest run` (after Wave 0) |
| Full suite command | Same for Phase 3 scope (pure unit); Extension Host suite later |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| DOM-01 | Abandoned / missing-tracking locals are candidates; healthy tracking excluded | unit | `npx vitest run src/domain/**/*.test.ts` | ❌ Wave 0 |
| DOM-02 | Current named HEAD excluded; detached allows named candidates only per D-02 | unit | `npx vitest run …candidates…` | ❌ Wave 0 |
| DOM-03 | `origin/HEAD` wins; then `origin/main` → `origin/master` → sorted `origin/*`; failure object when nothing resolves | unit | `npx vitest run …baseline…` | ❌ Wave 0 |
| DOM-04 | Same baseline ref used for all merge decisions in one run (orchestrator contract test) | unit | `npx vitest run …runPlan…` (optional) | ❌ Wave 0 |
| DOM-04 | `getMergeBase` → merged / not_merged / unknown mapping | unit (mock `getMergeBase`) | `npx vitest run …merge…` | ❌ Wave 0 |
| QUAL-01 | Fixtures cover predicates + ordering + merge mapping | unit | `npx vitest run` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npx vitest run` (targeted file if large suite later)
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Vitest green + `npm run check-types` (existing) before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] Add **`vitest`** devDependency and **`test` / `test:unit`** script in `package.json`
- [ ] Add **`vitest.config.ts`** (e.g. `include: ['src/**/*.test.ts']`, environment `node`)
- [ ] Create **`src/domain/**/*.test.ts`** with fixture tables for:
  - [ ] **Candidate rules:** matrix of `{ upstream?, commit?, HEAD name }` → expected candidate boolean
  - [ ] **Baseline ordering:** synthetic ref lists → expected chosen `refs/remotes/origin/...` or error
  - [ ] **Merge semantics:** mock returns merge base OID → `merged` / `not_merged` / `unknown`
  - [ ] **Error path:** “no `origin` remotes / no refs” → structured baseline error type

*(No gaps after Wave 0 and first test files land.)*

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | no | N/A (local Git UI) |
| V3 Session Management | no | N/A |
| V4 Access Control | no | N/A |
| V5 Input Validation | **low** | Ref strings originate from Git API, not end-user text; still avoid shell interpolation anywhere in future adapters |
| V6 Cryptography | no | N/A |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|----------------------|
| Command injection via ref names | Tampering / Elevation | **Already:** use vscode.git API, not shell-built Git strings `[CITED: PITFALLS.md / Phase 2 decisions]` |

## Sources

### Primary (HIGH confidence)

- `src/types/git.d.ts` — `Repository`, `getMergeBase`, `getRefs`, `getBranches`, `RepositoryState.HEAD` `[VERIFIED: workspace file]`
- `src/git/branches.ts` — `LocalBranchSummary` shape `[VERIFIED: workspace file]`
- `https://git-scm.com/docs/git-merge-base` — merge base definition; `--is-ancestor` / idiom `[CITED: official Git documentation]`
- `.planning/phases/03-domain-candidates-baseline-merge/03-CONTEXT.md` — locked decisions `[VERIFIED: workspace file]`
- `.planning/research/PITFALLS.md` — baseline + merge pitfalls `[VERIFIED: workspace file]`

### Secondary (MEDIUM confidence)

- `.planning/REQUIREMENTS.md` — requirement wording for DOM-* / QUAL-01 `[VERIFIED: workspace file]`
- `.planning/research/STACK.md` — Vitest as optional pure-logic runner `[VERIFIED: workspace file]`

### Tertiary (LOW confidence)

- Runtime fields on `Branch` beyond vendored `git.d.ts` for “gone” upstream — requires implementation-time verification in VS Code `[ASSUMED]`

## Metadata

**Confidence breakdown:**

- Standard stack: **HIGH** — API file + npm `vitest` version verified
- Architecture: **HIGH** — follows CONTEXT + Git documentation
- Pitfalls: **MEDIUM-HIGH** — grounded in project PITFALLS + Git docs; runtime upstream “gone” needs spike

**Research date:** 2026-04-14  
**Valid until:** ~2026-05-14 (revisit if `vscode.git` API or `engines.vscode` bump changes `Repository` surface)

## RESEARCH COMPLETE
