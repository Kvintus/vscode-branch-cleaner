# Phase 3: Domain — candidates, baseline, merge - Context

**Gathered:** 2026-04-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement **gitcleaner-style domain rules** on top of Phase 2’s read model: which locals are **cleanup candidates**, which **resolved integration baseline** all merge labels use for one run, and a **single consistent merged / not-merged** signal per candidate. Includes **automated tests** for pure logic (fixtures) per **QUAL-01**. Does **not** ship QuickPick UX (Phase 4), delete actions (Phase 5), or new raw Git subprocess paths—baseline probing continues to prefer **vscode.git** `Repository` / ref APIs already used for reads.

</domain>

<decisions>
## Implementation Decisions

### Candidate selection (DOM-01, DOM-02)

- **D-01:** A local branch is a **candidate** iff it is **not** the **current HEAD branch** (by short name match to `repository.state.HEAD`) and it matches **gitcleaner-style abandonment**: **no upstream**, or upstream metadata indicates **missing / invalid / “gone”** remote tracking (exact fields follow `LocalBranchSummary` / `git.d.ts` as implemented in Phase 2—predicate lives in domain and is unit-tested with fixture structs).
- **D-02:** **Detached HEAD** / unnamed current branch: treat **no branch name** as current; only named locals that pass the abandonment predicate are candidates (never invent a “current” synthetic name).
- **D-03:** Branches that **only** fail the candidate predicate (e.g. healthy tracking) are **out of scope** for the candidate list in v1—no second bucket in domain beyond “candidate vs not” unless planning adds an explicit non-goal.

### Baseline resolution (DOM-03)

- **D-04:** Each cleanup run computes **one** `ResolvedBaseline` object: **display label** (for later UXP-03) + **ref identity** used for merge checks. **Primary:** follow **`origin/HEAD`** when the symref `refs/remotes/origin/HEAD` resolves to a remote branch under `origin`. **Fallback order (fixed, documented in code + README fragment during implementation):** (1) `refs/remotes/origin/main`, (2) `refs/remotes/origin/master`, (3) if `origin` exists but none of the above resolve: **first** `refs/remotes/origin/*` head ref in stable sort order **excluding** `HEAD`—only as last resort; (4) if no usable remote baseline: domain/run layer returns a **structured error** (“cannot resolve default branch”) rather than silently picking a random local—user-visible message wording is integration, but the **contract** is “no baseline ⇒ no merge labels / no delete eligibility for this run.”
- **D-05:** **v2 `CFG-01`** (settings override) is **out of scope** for Phase 3—no settings read in domain module; overrides are deferred.

### Merge labeling (DOM-04, pitfalls alignment)

- **D-06:** **“Merged”** means: the candidate branch’s **tip commit** is **reachable from** the baseline tip (**ancestor** semantics), consistent with “no unique commits on the branch relative to integration tip.” Use **`Repository.getMergeBase`** (or equivalent API) to implement the check as recommended by vendored `git.d.ts` / runtime behavior—**not** `git branch --merged` CLI. If the API reports inability to compare, surface **unknown / error** state for that row rather than guessing.
- **D-07:** **Squash / rebase merge expectation mismatch** (see `.planning/research/PITFALLS.md`): product stance for v1 is **Git-ancestor merged** only; no special “squash-aware” label in Phase 3. Document in planner/UX copy follow-up for Phase 4 tooltip if needed.

### Structure, tests, and integration (QUAL-01)

- **D-08:** Add a **`src/domain/`** (or similarly named) module for **pure** functions: e.g. `isCandidate(...)`, `orderBaselineFallbacks(...)` on **plain data** types decoupled from `vscode` where possible. **Merge** classification may call `Repository` in a thin **adapter** in `src/git/` if pure graph is impractical; **unit tests** must cover at minimum **candidate predicates** and **fallback ordering / resolution helpers** with fixtures; merge wrapper tests use **mocked** `getMergeBase` / ref maps where feasible.
- **D-09:** **Vitest** (already in stack research) is acceptable for Node-isolated domain tests per project stack guidance; keep Extension Host tests separate.

### Claude's Discretion

- Exact file split (`candidates.ts` / `baseline.ts` / `merge.ts` vs single `cleanupDomain.ts`).
- Whether baseline resolution lives entirely in `src/git/` with domain importing types only, vs one `resolveBaselineForRun(repository)` next to domain—planner chooses as long as contracts in D-04–D-06 hold.

### Folded Todos

- None.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product and requirements

- `.planning/ROADMAP.md` — Phase 3 goal, success criteria, requirement IDs **DOM-01–DOM-04**, **QUAL-01**.
- `.planning/REQUIREMENTS.md` — Acceptance text for **DOM-01**–**DOM-04**, **QUAL-01**.
- `.planning/PROJECT.md` — Core value, Key Decisions table, out-of-scope notes.

### Prior phase and research

- `.planning/phases/02-git-repository-read-path/02-CONTEXT.md` — Repository mapping, `LocalBranchSummary`, deferral of domain rules to Phase 3.
- `.planning/research/PITFALLS.md` — Merge baseline pitfalls, `origin/HEAD` staleness, ancestor semantics (**§ Critical Pitfall 1–2**).
- `.planning/research/ARCHITECTURE.md` — High-level layering if present for this repo.
- `src/git/branches.ts` — Current branch read shape and upstream capture.
- `src/types/git.d.ts` — Pinned **vscode.git** API surface for `Repository`, `getMergeBase`, refs.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `src/git/branches.ts` — `listLocalBranches` / `LocalBranchSummary` as the input DTO for candidate classification.
- `src/git/api.ts`, `src/git/repositoryPicker.ts` — Where a **per-run baseline resolver** can attach after repo resolution.
- `src/extension.ts` — Command entrypoint will eventually compose **resolve → classify → (later) UI**.

### Established Patterns

- **vscode.git API only** for Git operations in extension code (Phase 2 decision)—domain merge checks go through `Repository`, not CLI.

### Integration Points

- Candidate + merge results feed **Phase 4** QuickPick rows and **Phase 5** delete eligibility; **single `ResolvedBaseline` per run** must be threaded from Phase 3 outward.

</code_context>

<specifics>
## Specific Ideas

- Align baseline fallback ordering with `.planning/research/PITFALLS.md` guidance on missing **`origin/HEAD`**.

</specifics>

<deferred>
## Deferred Ideas

- **Settings-based baseline override** (**CFG-01**) — v2.
- **“Refresh origin/HEAD”** helper action — nice-to-have; not required for Phase 3 domain closure.
- **Worktree-aware delete hints** — primarily Phase 5 / Phase 4 messaging; domain may only expose branch names for now.

### Reviewed Todos (not folded)

- None.

</deferred>

---

*Phase: 03-domain-candidates-baseline-merge*
*Context gathered: 2026-04-14*
