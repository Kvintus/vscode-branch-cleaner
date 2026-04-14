# Requirements: VS Code Branch Cleaner

**Defined:** 2026-04-14  
**Core Value:** Safe, explicit local branch cleanup inside the editor — same mental model as gitcleaner (candidates, merge signal, pick what to remove), without relying on JetBrains.

## v1 Requirements

### Extension & command surface

- [ ] **EXT-01**: Extension contributes a **Cleanup Branches** command discoverable from the Command Palette with a clear title and category (Git).
- [ ] **EXT-02**: Extension uses **lazy activation** appropriate to a Git workflow extension (command and/or workspace git presence — not `*` activation).
- [ ] **EXT-03**: `package.json` declares **`extensionDependencies`** on **`vscode.git`** so Git APIs are available where required.
- [ ] **EXT-04**: Toolchain supports **typecheck + bundle + package** suitable for VS Code/Cursor publishing (`engines.vscode` aligned with `@types/vscode`, documented build scripts).

### Git read path

- [ ] **GIT-01**: For an opened folder with a Git repository, the extension can obtain a **Repository** handle via the built-in Git extension API.
- [ ] **GIT-02**: Extension can **enumerate local branches** and enough **upstream / tracking metadata** to classify **gitcleaner-style candidates** (no upstream / missing or invalid tracking / “gone” upstream — exact predicate finalized in implementation with documented UX).
- [ ] **GIT-03**: Git failures (no repo, Git disabled, unexpected errors) produce **clear, user-visible errors** (notifications or messages), not silent failure.

### Domain rules (candidates + merge)

- [ ] **DOM-01**: **Candidate set** matches **gitcleaner-style intent** from `PROJECT.md` (not “all local branches”; abandoned / missing-remote-tracking style candidates).
- [ ] **DOM-02**: **Current branch** is **never** included in the candidate list.
- [ ] **DOM-03**: Merge comparison uses **`origin/HEAD`** as the default integration baseline, with a **documented fallback order** when `origin/HEAD` is missing or unusable.
- [ ] **DOM-04**: Each listed candidate shows **merged vs not merged** relative to the **same resolved baseline** used for any delete eligibility checks.

### Cleanup UI

- [ ] **UXP-01**: User reviews candidates in a **multi-select QuickPick** (or equivalent native selection UX) and can **cancel** with **no branch mutations**.
- [ ] **UXP-02**: User **explicitly selects** which candidates to delete; there is **no** v1 “delete all” shortcut that bypasses review.
- [ ] **UXP-03**: UI surfaces the **resolved baseline name** (or explicit fallback label) so merge indicators are interpretable.

### Safety & deletion

- [x] **SAFE-01**: **Non-merged** selections are handled by a **consistent safety policy** (block delete, or strong confirmation — chosen once and reflected in UX copy) that **never contradicts** merge labels.
- [x] **SAFE-02**: v1 performs **local branch deletion only** (no remote/host branch deletion).
- [x] **SAFE-03**: After deletion attempts, user sees a **summary** of successes and failures (no silent partial success).

### Verification

- [ ] **QUAL-01**: Automated tests cover **pure domain logic** (candidate selection + merge/baseline classification) with fixtures where practical.
- [ ] **QUAL-02**: README states **supported editors** (VS Code + Cursor) and **minimum version expectations** at a high level (exact pinning finalized during implementation).

## v2 Requirements

### Configuration & polish

- **CFG-01**: Settings for **default remote** and optional **explicit merge baseline** override (precedence documented).
- **CFG-02**: Optional **dry-run / final confirmation** step before deletes (after core flow is trusted).

### UX enhancements

- **UXP-10**: Richer QuickPick (`createQuickPick`) with grouping/sorting (e.g. merged first) if users report cramped review UX.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Remote branch deletion on Git host | Explicitly deferred; expands auth/permission and failure modes beyond v1 parity goal |
| Non-Git version control | Git-only product scope |
| Auto cleanup on folder open / fetch | Conflicts with explicit, review-first safety positioning |
| Full JetBrains plugin edge-case parity before first ship | Ship documented flow first; close gaps as validated |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| EXT-01 | 1 | Pending |
| EXT-02 | 1 | Pending |
| EXT-03 | 1 | Pending |
| EXT-04 | 1 | Pending |
| GIT-01 | 2 | Pending |
| GIT-02 | 2 | Pending |
| GIT-03 | 2 | Pending |
| DOM-01 | 3 | Pending |
| DOM-02 | 3 | Pending |
| DOM-03 | 3 | Pending |
| DOM-04 | 3 | Pending |
| UXP-01 | 4 | Pending |
| UXP-02 | 4 | Pending |
| UXP-03 | 4 | Pending |
| SAFE-01 | 5 | Complete |
| SAFE-02 | 5 | Complete |
| SAFE-03 | 5 | Complete |
| QUAL-01 | 3 | Pending |
| QUAL-02 | 1 | Pending |

**Coverage:**

- v1 requirements: 19 total
- Mapped to phases: 19
- Unmapped: 0

---
*Requirements defined: 2026-04-14*  
*Last updated: 2026-04-14 after roadmap traceability*
