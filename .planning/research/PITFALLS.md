# Pitfalls Research

**Domain:** VS Code / Cursor extensions that automate **local** Git branch deletion with merge-aware safety  
**Researched:** 2026-04-14  
**Confidence:** **MEDIUM** — grounded in Git semantics and extension-host behavior; some edge cases benefit from phase-level verification against real repos (especially shallow clones and large monorepos).

## Critical Pitfalls

### Pitfall 1: Wrong merge baseline or merge predicate (“looks merged” but is not)

**What goes wrong:**  
The UI labels a branch **merged** and allows delete (or auto-blocks inconsistently) while the branch still contains commits not reachable from the chosen integration branch—**data loss** or **blocked cleanup** depending on which direction the bug goes.

**Why it happens:**  
- Comparing against the **wrong ref** (e.g. local `main` instead of remote default, or stale `origin/main`).  
- Using **`git branch --merged`** semantics without aligning to the **same** integration ref the product promises (here: default implied by `origin/HEAD` with fallbacks).  
- Confusing “reachable from tip” with “would merge cleanly” — users expect **no unique commits on the branch** relative to the integration baseline.

**How to avoid:**  
- Treat the **resolved default integration ref** (e.g. `refs/remotes/origin/main`) as the single source of truth for “merged.”  
- Prefer explicit ancestry checks: e.g. `git merge-base --is-ancestor branch tip` (or equivalent) so the definition matches “all commits on branch are contained in integration tip.”  
- Resolve integration tip **once per cleanup run** (or invalidate on explicit refresh) so labels stay consistent for one review session.

**Warning signs:**  
- Users report “deleted my work” on **squash-merge** or **rebase-merge** workflows (often a **product expectation** issue: Git “merged” ≠ “same commits on main”). Mitigate with **clear definition** in UI and conservative defaults.  
- Intermittent wrong labels after **fetch** or **checkout** mid-session.  
- Disagreement between extension and `git log branch..integration`.

**Phase to address:**  
**Phase 2 — Default branch & merge semantics** (define and test merge predicate + integration ref). **Phase 4 — Delete flow** (re-validate immediately before delete).

---

### Pitfall 2: Missing, stale, or ambiguous `origin/HEAD`

**What goes wrong:**  
Wrong default branch chosen (`main` vs `master` vs enterprise default), **false merged/not-merged**, or noisy **UX** when every run starts with errors.

**Why it happens:**  
`origin/HEAD` is optional; remotes may not advertise it; **single-remote assumption** breaks; **renamed default** leaves symbolic ref stale until `git remote set-head origin -a`.

**How to avoid:**  
- Probe `refs/remotes/origin/HEAD` (and parse symref target); on failure, fall back to **documented order**: remote HEAD from `git remote show origin`, then common names, then **user-configured** default in settings.  
- Surface **which ref** is used in the cleanup UI (“Compared against: `origin/main`”).  
- Optionally offer **“Refresh remote default”** (runs `remote set-head` or equivalent) without deleting anything.

**Warning signs:**  
- `git branch -r` shows `origin/HEAD -> origin/foo` but extension uses something else.  
- New repos clone but extension picks `master` while remote uses `main`.

**Phase to address:**  
**Phase 2 — Default branch & merge semantics** (resolution + fallbacks + visibility). **Phase 5 — Cross-platform / repo QA** (regression fixtures for missing symref).

---

### Pitfall 3: Git worktrees (branch “not checked out here” but still in use)

**What goes wrong:**  
`git branch -d/-D` **fails** or, worse, scripts assume success and show **partial cleanup**; user confusion when “merged” branch refuses delete.

**Why it happens:**  
A branch may be **checked out in another worktree**; Git refuses to delete the branch that is **HEAD** of any worktree.

**How to avoid:**  
- Before delete: `git worktree list` (parse) and **exclude or annotate** branches that appear as locked by another worktree; never treat as silent success.  
- Error messages should name **which path** holds the worktree.

**Warning signs:**  
- `error: Cannot delete branch 'feature' used by worktree at /path`  
- CI or second clone on same machine using worktrees.

**Phase to address:**  
**Phase 3 — Candidates & safety invariants** (eligibility model). **Phase 4 — Delete flow** (pre-flight check per branch).

---

### Pitfall 4: Shallow clones and incomplete history

**What goes wrong:**  
**Incorrect merge/ancestor results** or unstable behavior: merge-base may not exist across shallow boundary; “merged” flips after **unshallow**.

**Why it happens:**  
Shallow repos omit objects; Git cannot prove ancestry across missing segments.

**How to avoid:**  
- Detect shallow repo (`git rev-parse --is-shallow-repository`) and **degrade gracefully**: banner in UI (“Shallow clone — merge checks may be incomplete”), default to **stricter** delete rules (e.g. treat merge unknown as **not merged** unless user overrides).  
- Document limitation; avoid claiming HIGH confidence for merge labels in shallow mode.

**Warning signs:**  
- `.git/shallow` exists or `is-shallow-repository` is `true`.  
- Merge weirdness only on CI checkouts with `--depth`.

**Phase to address:**  
**Phase 2 — Merge semantics** (detection + policy). **Phase 5 — Hardening** (fixture shallow repo tests).

---

### Pitfall 5: Case sensitivity / ref normalization on Windows

**What goes wrong:**  
Duplicate or “missing” branches in UI, wrong ref selected, or failed deletes when **filesystem is case-insensitive** but Git refs differ by case.

**Why it happens:**  
Remote uses `Feature`; local uses `feature`; tooling compares strings without canonical form.

**How to avoid:**  
- Normalize for **display vs Git invocation** carefully: always pass refs Git accepts; avoid double-fetching by incorrect casing.  
- Test on **Windows** with case-only variants; prefer Git’s ref output as canonical for commands.

**Warning signs:**  
- Same branch appears twice in pickers.  
- `fatal: Invalid branchname` or ambiguous ref errors only on Windows.

**Phase to address:**  
**Phase 3 — Candidates** (listing normalization). **Phase 5 — Cross-platform QA** (Windows-specific matrix).

---

### Pitfall 6: Ambiguous short branch names and ref parsing

**What goes wrong:**  
Spurious failures, wrong branch targeted, or security-adjacent confusion when **short names** collide with tags or other refs.

**Why it happens:**  
Passing `foo` instead of `refs/heads/foo`; ambiguous revision if tag and branch share prefix.

**How to avoid:**  
- Internally carry **`refs/heads/...` full names** from `for-each-ref` style queries; never rely on ambiguous short names for destructive commands.  
- Quote/reflog-safe invocations; avoid shell string concatenation for args (use `execFile` with argv arrays).

**Warning signs:**  
- `warning: refname 'foo' is ambiguous.`  
- Deletes affecting unexpected ref (catastrophic — rare if full refnames used).

**Phase to address:**  
**Phase 3 — Candidates & ref model**. **Phase 4 — Delete flow** (command construction).

---

### Pitfall 7: Race with concurrent Git operations

**What goes wrong:**  
Stale candidate list, delete against **moved tip**, or errors during **fetch/rebase** in another terminal or built-in Git UI.

**Why it happens:**  
Repo state is **mutable**; extension host has no global lock with other Git clients.

**How to avoid:**  
- Short **critical section**: immediately before each delete (or batch), re-check **still merged** and **still eligible** (not current, not worktree HEAD).  
- On failure, **abort batch**, show partial results, suggest retry.  
- Optional: detect `index.lock` / `gc.pid` and block with clear message (best-effort; not foolproof).

**Warning signs:**  
- Flaky CI or user scripts running `git fetch --prune` while cleanup runs.  
- VS Code Source Control refreshing during delete.

**Phase to address:**  
**Phase 4 — Delete orchestration** (transactional semantics + user messaging). **Phase 5 — Stress / integration** tests.

---

### Pitfall 8: Extension host Git binary vs user’s CLI Git (“works in terminal, fails in VS Code”)

**What goes wrong:**  
Different **feature availability**, **credential helpers**, or **path** behavior; hardest: **different merge/ref behavior** across rare Git versions.

**Why it happens:**  
VS Code may use **bundled Git** or `git.path` / `git.pathAndArgs`; users may assume system Git.

**How to avoid:**  
- Use `git.path` from VS Code / workspace settings when spawning Git (per VS Code Git configuration), with explicit override setting for power users if needed.  
- Log **Git version** in output channel (debug) to reproduce issues.  
- Document supported **minimum Git** version for merge checks in use.

**Warning signs:**  
- Commands succeed in iTerm but fail in extension with same repo.  
- Feature flags differ (`merge-tree`, etc.) between versions.

**Phase to address:**  
**Phase 1 — Extension shell & Git adapter** (spawn + config wiring). **Phase 5 — Compatibility** (version matrix).

---

### Pitfall 9: Credential / remote access (lower relevance here)

**What goes wrong:**  
Resolution of `origin/HEAD` or remote default via **remote show** may **prompt** or **hang** in non-interactive contexts.

**Why it happens:**  
Network or auth needed for some commands; extension child process is not a TTY.

**How to avoid:**  
Prefer **local-only** ref reads (`for-each-ref`, `symbolic-ref`) before anything that hits network; avoid implicit fetch during cleanup **v1** unless explicitly requested.

**Warning signs:**  
- Cleanup “hangs” on first run in restricted environments.

**Phase to address:**  
**Phase 2 — Default branch resolution** (local-first strategy). **Phase 1** if any network Git is introduced later.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Use `git branch --merged` only, no explicit integration ref | Faster to ship | Wrong baseline / user distrust | Never if product promises `origin/HEAD` semantics |
| Assume `main` when `origin/HEAD` missing | Simple code | Wrong deletes in `master`/custom-default repos | MVP only with loud UI + setting |
| Ignore worktrees | Simpler model | Confusing failures at delete time | Never for v1 if “safe cleanup” is core value |
| Shell out via `sh -c` with string refs | Quick hack | Injection / ambiguity risk | Never |
| No shallow-clone handling | Simpler UI | Rare but severe mis-merge signals | MVP with explicit “unsupported” banner |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|-------------------|
| VS Code Git settings | Ignore `git.path` | Resolve executable same way users expect Git extension to |
| Git CLI | Use short branch names for `-d` | Pass full `refs/heads/*` from `for-each-ref` |
| Git + worktrees | Only check current checkout | `git worktree list` / lock detection |
| Remote default | Rely on clone-time guess only | Symref + ordered fallbacks + user setting |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| O(n) Git invocations per branch | UI lag on 500+ branches | Batch `for-each-ref`, combine merge checks | Large repos / monorepo feature factories |
| Full ref scan every keystroke | CPU spikes | Debounce; cache until refresh/fetch | Large `refs/` |
| Synchronous spawn on UI thread | Frozen editor | Offload to worker / async queue | Slow disks / Windows AV |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|--------------|
| Treating user-provided strings as shell fragments | Command injection | `execFile` with argv array; no shell |
| Over-broad `-D` without merged re-check | Data loss | Separate force path; explicit warnings |
| Logging full ref lists in shared telemetry | Leak branch names | Keep telemetry opt-in / local-only for v1 |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| “Merged” without defining squash/rebase | Feels unsafe or “wrong” | Short explanation + link to docs; optional strict mode |
| Silent skip after partial delete | Thinks all selected branches gone | Summary dialog with per-branch result |
| No visible integration ref | Distrust | Always show comparison ref |

## "Looks Done But Isn't" Checklist

- [ ] **Merge check:** Verified against **full refnames**, not ambiguous short names — verify with ambiguous fixture repo.
- [ ] **Default branch:** Behavior when `origin/HEAD` **missing**, **broken**, and **stale** — verify all three fixtures.
- [ ] **Worktrees:** Branch checked out in **secondary worktree** — verify blocked with clear reason.
- [ ] **Shallow:** `is-shallow-repository` path shows **banner** and conservative policy — verify.
- [ ] **Concurrency:** Delete while `git fetch` runs — verify no false “success.”
- [ ] **Windows:** Case-only branch pair — verify listing and delete target **one** ref.
- [ ] **Git binary:** Wrong `git.path` still fails gracefully with actionable error — verify.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Wrong merge / accidental delete | **HIGH** | `git reflog` / restore from backup; extension cannot undo — emphasize confirmation and `reflog` in docs |
| origin/HEAD wrong | **LOW** | `git remote set-head origin -a`; user setting override |
| Worktree block | **LOW** | Remove other worktree or checkout elsewhere; retry |
| Shallow mis-label | **MEDIUM** | `git fetch --unshallow` then re-run; adjust policy |
| Race partial failure | **LOW** | Re-run cleanup; fix integration branch refresh |

## Pitfall-to-Phase Mapping

Suggested phases (no `ROADMAP.md` in repo yet — rename when roadmap exists):

| Phase (suggested) | Scope |
|-------------------|--------|
| **Phase 1 — Extension shell & Git adapter** | Spawn Git, `git.path`, argv-only execution, output channel / errors |
| **Phase 2 — Default branch & merge semantics** | `origin/HEAD`, fallbacks, merge predicate, shallow policy |
| **Phase 3 — Candidates & safety invariants** | gitcleaner-style rules, full refnames, worktree exclusion, current-branch rule |
| **Phase 4 — Cleanup UI & delete orchestration** | Selection UX, pre-delete re-checks, batch results, races |
| **Phase 5 — Cross-platform & repo-state QA** | Windows case, large repos, fixtures, version matrix |

| Pitfall | Prevention Phase | Verification |
|---------|------------------|----------------|
| Wrong merge baseline / predicate | Phase 2 (+ Phase 4 re-check) | Fixture repos: linear merge, squash (expectation), branch ahead by 1 commit |
| `origin/HEAD` missing/stale | Phase 2 | Symref removed; remote rename; `set-head` refresh |
| Worktrees | Phase 3–4 | Second worktree on branch; ensure no delete + clear error |
| Shallow clones | Phase 2–5 | Shallow fixture; banner + conservative merge default |
| Windows case sensitivity | Phase 3–5 | Case-pair fixture on Windows agent |
| Ambiguous branch names | Phase 3–4 | Tag/branch collision fixture; `for-each-ref` only |
| Race with other Git ops | Phase 4 | Parallel fetch script during delete |
| Extension host vs Git path | Phase 1–5 | Point `git.path` at old/new Git; behavior documented |
| Credential / network hangs | Phase 2 | Air-gapped / no TTY; ensure no implicit network |

## Sources

- Git documentation: [git-merge-base](https://git-scm.com/docs/git-merge-base), [git-worktree](https://git-scm.com/docs/git-worktree), [git-branch](https://git-scm.com/docs/git-branch), [git-remote](https://git-scm.com/docs/git-remote) (symref / `set-head`). **MEDIUM confidence** for exact flag matrix — validate against minimum supported Git in CI.  
- VS Code extension guidance: Git integration and `git.path` behavior — see [Visual Studio Code docs](https://code.visualstudio.com/docs) (search: Git `git.path`). **MEDIUM** — confirm current setting names in target VS Code version during implementation.  
- Product intent: `.planning/PROJECT.md` (default via `origin/HEAD`, gitcleaner-style candidates, local-only delete). **HIGH** for requirements mapping.

---
*Pitfalls research for: VS Code extension automating local Git branch cleanup*  
*Researched: 2026-04-14*
