# Phase 2: Git repository read path - Context

**Gathered:** 2026-04-14
**Status:** Ready for planning

<domain>
## Phase Boundary

For a folder that contains a Git repository, the extension obtains a reliable **Repository** handle through the built-in **vscode.git** API, reads **local branches** plus enough **upstream / tracking metadata** for later gitcleaner-style classification, and surfaces **explicit user-visible errors** when Git is unavailable or reads fail. No merge baseline resolution, candidate filtering beyond what the API naturally exposes, QuickPick review UI, or deletion in this phase.

</domain>

<decisions>
## Implementation Decisions

### Repository resolution (GIT-01)

- **D-01:** Use **Git extension API v1** only (`extensions.getExtension('vscode.git')` → `exports.getAPI(1)`). No raw `child_process` / `simple-git` for this phase.
- **D-02:** Map workspace → repo by comparing each `Repository.rootUri.fsPath` (normalized) to each `vscode.workspace.workspaceFolders` entry. Require at least one match for a successful read path.
- **D-03:** **Multiple repos** in the workspace: prefer the repository whose `rootUri` contains the **active text editor** document URI (workspace folder resolution). If the editor is not inside any matched repo, use the **first** workspace folder order that has a matching `Repository` (deterministic, documented in code comments).
- **D-04:** If **no** `Repository` matches any workspace folder (no Git, Git extension disabled, or folder not opened as a repo): show **`vscode.window.showErrorMessage`** with a clear, user-actionable sentence (open a Git folder, enable Git, etc.) — never a silent no-op.

### Branch and upstream read surface (GIT-02)

- **D-05:** Enumerate **local** branches via **`Repository.getBranches`** with a query appropriate for **local** refs (per current `git.d.ts` / API contract). Do not rely on undocumented internals.
- **D-06:** Capture **per-branch** fields needed for **later** DOM phase: at minimum **short name**, **tip commit** if exposed, and **upstream / tracking** relationship (e.g. upstream name, “gone” or missing upstream if representable). Exact field names follow the vendored or upstream **`git.d.ts`** during implementation; if a field is absent, document the gap in RESEARCH and use the **narrowest** additional Git API call on `Repository` (still no raw Git CLI) before escalating to project backlog.
- **D-07:** **Do not** implement gitcleaner candidate predicates or `origin/HEAD` baseline in this phase — only **read** and structure data for Phase 3.

### Failure and UX signaling (GIT-03)

- **D-08:** Any caught failure from Git API calls → **`showErrorMessage`** (or `showWarningMessage` only if the operation can still proceed meaningfully; default is **error** when no data to show). Include a short **operation label** (e.g. “Branch Cleaner: could not list branches”).
- **D-09:** **Git extension missing** despite `extensionDependencies`: treat as configuration / activation edge case — message should say the **Git** built-in is required and link user to Extensions if appropriate (wording only; no new dependencies).

### Claude's Discretion

- Exact helper module layout under `src/` (single `gitWorkspace.ts` vs split `repoResolve.ts` / `branchRead.ts`).
- Whether to add a minimal **Output** channel for debug strings in this phase (default: **no**, stay with notifications unless planning needs trace).
- Normalization details for `fsPath` comparison on Windows (`toLowerCase` only where required by VS Code path rules).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product and requirements

- `.planning/ROADMAP.md` — Phase 2 goal, success criteria, dependency on Phase 1.
- `.planning/REQUIREMENTS.md` — **GIT-01**, **GIT-02**, **GIT-03** acceptance text.
- `.planning/PROJECT.md` — Core value, Git/vscode.git constraints, “no raw Git by default” positioning.

### Prior phase artifacts

- `.planning/phases/01-extension-scaffold-activation-and-packaging/01-VERIFICATION.md` — Confirms `vscode.git` dependency and activation wiring shipped.
- `.planning/phases/01-extension-scaffold-activation-and-packaging/01-PLAN.md` — Scaffold scope reference.

### API contract (implementation must pin)

- Microsoft **`extensions/git/src/api/git.d.ts`** at the **`engines.vscode`** generation in use — vendor a copy under e.g. `src/types/git.d.ts` or `vendor/git.d.ts` matching **1.96** line if planner requires stable types (recommended in project stack research).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `src/extension.ts` — Registers `branchCleaner.cleanupBranches`; the cleanup command is the natural call site to invoke **repo resolve + branch read** once Git wiring exists.

### Established Patterns

- **Lazy activation** via `onCommand` + `workspaceContains:**/.git` — Git read runs only when user drives the command (or workspace has `.git`), consistent with Phase 1 manifest.

### Integration Points

- **vscode.git** `GitExtension` / `API` / `Repository` — all new read logic connects here; `package.json` already declares `"extensionDependencies": ["vscode.git"]`.

</code_context>

<specifics>
## Specific Ideas

- No specific requirements — auto-discuss defaults align with **CLAUDE.md** / stack guidance: prefer **vscode.git** `Repository` for branch and upstream questions.

</specifics>

<deferred>
## Deferred Ideas

- **Merge baseline** (`origin/HEAD` + fallbacks) and **gitcleaner-style candidate filtering** — Phase 3.
- **QuickPick** and explicit per-branch delete selection — Phase 4.
- **Deletion, safety policy, summaries** — Phase 5.

### Reviewed Todos (not folded)

- None — `todo match-phase` returned no matches.

</deferred>

---

*Phase: 02-git-repository-read-path*
*Context gathered: 2026-04-14*
