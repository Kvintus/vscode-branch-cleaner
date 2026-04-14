# Stack Research

**Domain:** VS Code / Cursor extension (Git branch cleanup, JetBrains gitcleaner–style flow)  
**Researched:** 2026-04-14  
**Confidence:** **HIGH** for bundling, publishing, test-runner shape, and `vscode.git` API surface (verified against official VS Code docs and `git.d.ts` in the VS Code repo). **MEDIUM** for exact minimum `engines.vscode` floor (depends on lowest VS Code/Cursor version you choose to support; vsce enforces consistency with `@types/vscode`).

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **VS Code API / runtime** | `engines.vscode`: caret range you explicitly support (see below) | Extension host APIs (`commands`, `window`, workspace, progress) | Non-negotiable contract with the editor; drives which APIs exist at runtime. |
| **`@types/vscode`** | Same **major.minor line** as `engines.vscode` minimum (e.g. `^1.96.0` with `engines.vscode` `^1.96.0`) | Typings for `import * as vscode from 'vscode'` | **vsce** rejects manifests where typings imply a **newer** API surface than `engines.vscode` allows; keep them aligned (see [vsce issue discussion](https://github.com/microsoft/vscode-vsce/issues/455) and StackOverflow Q&A on version mismatch). |
| **TypeScript** | **5.9.x or 6.x** (e.g. **6.0.x** — `typescript@6.0.2` on npm as of research date) | Typechecking + editor tooling | Independent of `engines.vscode`; use a current TS release. Official bundling guidance runs **`tsc --noEmit`** alongside esbuild because esbuild does not typecheck ([Bundling Extensions](https://code.visualstudio.com/api/working-with-extensions/bundling-extension)). |
| **Node.js (dev / CI only)** | **22.x LTS** (minimum **20.x** acceptable) | `npm`, `vsce`, tests, esbuild | Publishing docs require Node for `vsce` ([Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)). Extension **runtime** is VS Code’s embedded Node/Electron — do not assume latest Node globals unless verified. |
| **esbuild** | **0.28.x** (e.g. **0.28.0** on npm as of research date) | Bundle `src/extension.ts` → single `dist/extension.js` | Official docs present **esbuild first**, with a maintained pattern: `bundle`, `platform: 'node'`, **`external: ['vscode']`**, optional minify for production ([Bundling Extensions — Using esbuild](https://code.visualstudio.com/api/working-with-extensions/bundling-extension)). Faster and less config than webpack for **desktop** extensions. |

### Supporting / integration choices

| Library / integration | Version | Purpose | When to Use |
|----------------------|---------|---------|-------------|
| **Built-in `vscode.git` extension API** | API **version `1`** via `GitExtension.getAPI(1)` | Repositories, refs/branches, upstream metadata, `getMergeBase`, `deleteBranch`, `getRefs`, etc. | **Default path** for this product: branch lists, upstream presence, merge-base style questions, and deletes should go through the same Git abstraction VS Code uses ([`git.d.ts` in microsoft/vscode](https://raw.githubusercontent.com/microsoft/vscode/main/extensions/git/src/api/git.d.ts)). |
| **`extensionDependencies`** | n/a (manifest) | Guarantee Git extension present | Add **`"vscode.git"`** to `extensionDependencies` if you rely on the API (manifest reference: [Extension Manifest](https://code.visualstudio.com/api/references/extension-manifest)). |
| **Vendored `git.d.ts` (optional)** | Pin to a commit matching your minimum VS Code | Stable TypeScript types for `vscode.git` exports | Official surface is the `.d.ts` in the repo; many extensions vendor a copy to avoid drift ([implementation source](https://github.com/microsoft/vscode/blob/main/extensions/git/src/api/git.d.ts)). |

### Development Tools

| Tool | Version (npm @ research) | Purpose | Notes |
|------|--------------------------|---------|--------|
| **`@vscode/vsce`** | **3.7.x** (e.g. **3.7.1**) | `vsce package` / `publish` | Official scoped package per current docs: `npm install -g @vscode/vsce` ([Publishing Extensions — vsce](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)). Prefer **project-local** `devDependency` + `npx vsce` in CI. |
| **`@vscode/test-cli`** + **`@vscode/test-electron`** | Use current majors from npm | `vscode-test` integration tests | Official **Testing Extensions** doc: test CLI “exclusively uses **Mocha** under the hood” ([Testing Extensions](https://code.visualstudio.com/api/working-with-extensions/testing-extension)). This is the supported way to run tests in a real Extension Host. |
| **`mocha`** + **`@types/mocha`** | Current stable | Assertions / TDD or BDD style in integration tests | Matches what `@vscode/test-cli` drives; same mental model as Microsoft samples. |
| **`npm-run-all` (run-p)** | Current | Parallel `tsc --noEmit --watch` + `esbuild --watch` | Recommended in the official esbuild bundling recipe ([Bundling Extensions](https://code.visualstudio.com/api/working-with-extensions/bundling-extension)). |
| **`eslint`** + **`typescript-eslint`** | Current | Lint | Standard for TS extensions; no VS Code–specific requirement. |

### Optional (not minimal)

| Tool | Version (npm @ research) | Purpose | When to Use |
|------|--------------------------|---------|-------------|
| **Vitest** | **4.x** (e.g. **4.1.4**) | **Fast unit tests** for pure TS (merge rules, ref parsing, candidate filtering) **without** loading `vscode` | Reasonable **second** test runner only for Node-isolated modules. **Do not** use Vitest as the primary replacement for `@vscode/test-cli` if you need Extension Host coverage. |

## Installation

```bash
# Runtime: none (extension ships compiled JS + optional vendored types)

# Dev — core toolchain (illustrative; pin after `npm init`)
npm install -D typescript@~6.0.0 @types/vscode@"^<same as engines.vscode>" esbuild@~0.28.0

# Dev — packaging + tests (official paths)
npm install -D @vscode/vsce @vscode/test-cli @vscode/test-electron mocha @types/mocha

# Dev — parallel watch (official esbuild sample)
npm install -D npm-run-all

# Optional — pure-logic unit tests only
npm install -D vitest@^4.1.0
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| **esbuild** (desktop, `platform: 'node'`) | **webpack** + **ts-loader**, `target: 'webworker'` | You **must** ship a single bundle that also runs in **vscode.dev / github.dev** (web Extension Host). Official webpack sample targets `webworker` for that reason ([Bundling Extensions — Using webpack](https://code.visualstudio.com/api/working-with-extensions/bundling-extension)). |
| **`vscode.git` API** | **`child_process`** / **`simple-git`** / **dugite** | Narrow escape hatch when the built-in API cannot express an operation you still need (document each case). **Not** as the default architecture. |
| **`@vscode/test-cli` + Mocha** | **Vitest-only** or **Jest in Extension Host** | Almost never: integration tests need a real VS Code instance; Microsoft’s test CLI is the supported path ([Testing Extensions](https://code.visualstudio.com/api/working-with-extensions/testing-extension)). |
| **`@vscode/vsce`** | Legacy global **`vsce`** without scope | Avoid; docs point at **`@vscode/vsce`** ([Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)). |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **Misaligned `@types/vscode` > `engines.vscode`** | Packaging/publish failures and false sense of API availability ([vsce #455](https://github.com/microsoft/vscode-vsce/issues/455)). | Bump **`engines.vscode`** first, then match **`@types/vscode`**. |
| **esbuild as the only “type checker”** | esbuild strips types; only syntax errors fail the build ([Bundling Extensions](https://code.visualstudio.com/api/working-with-extensions/bundling-extension)). | **`tsc --noEmit`** in `compile` / `package` scripts. |
| **Jest for Extension Host integration tests** | Not the documented or CLI-supported path; heavy ESM/CJS interop with `vscode` mock pain. | **`@vscode/test-cli`** + **Mocha**; optional **Vitest** only for pure functions. |
| **`simple-git` / extra Git binaries in-repo** | Extra dependency surface and duplicate Git orchestration vs the editor’s built-in Git. | **`vscode.git` `Repository` / `API`** ([`git.d.ts`](https://raw.githubusercontent.com/microsoft/vscode/main/extensions/git/src/api/git.d.ts)). |
| **Raw `git` for branch delete by default** | Bypasses VS Code’s Git integration, error handling, and “Git disabled” scenarios. | **`repository.deleteBranch`** from the Git API unless you have a documented gap. |
| **Global-only Node assumptions** | Extension host Node version ≠ your laptop’s Node. | Feature-detect or consult VS Code release notes when using bleeding-edge Node APIs. |

## Stack Patterns by Variant

**If the extension stays desktop-only (VS Code + Cursor on Electron):**

- Use **esbuild** with `platform: 'node'`, `format: 'cjs'` (matches the official sample), `external: ['vscode']`.
- Prefer **`vscode.git` API** for branch/merge/delete operations.

**If you later require vscode.dev / web:**

- Add a **separate webpack (or second esbuild target)** pipeline with **`target: 'webworker'`** per official webpack guidance ([Bundling Extensions — Using webpack](https://code.visualstudio.com/api/working-with-extensions/bundling-extension)).
- Re-evaluate **Git**: web/workspace constraints may force different UX (remote repos, virtual FS); treat as a **new milestone**, not a v1 tweak.

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `@types/vscode@^X.Y.Z` | `engines.vscode@^X.Y.0` (same API generation) | `@types` must not advertise APIs **above** your declared engine range; vsce enforces this relationship. |
| `typescript@5.9–6.x` | `@types/node` for your **dev** Node (20/22) | `@types/node` is for build/test scripts, not the extension host. |
| **`vscode.git` API** | `getAPI(1)` contract | Breaking changes have occurred historically ([issue #169652](https://github.com/microsoft/vscode/issues/169652)); pin vendored `git.d.ts` and test on oldest supported VS Code. |

## Sources

- [Bundling Extensions](https://code.visualstudio.com/api/working-with-extensions/bundling-extension) — esbuild + `tsc --noEmit`, webpack `webworker` target, publish via `vscode:prepublish` (**HIGH**).
- [Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension) — `@vscode/vsce`, Node prerequisite, `engines.vscode` semantics (**HIGH**).
- [Testing Extensions](https://code.visualstudio.com/api/working-with-extensions/testing-extension) — `@vscode/test-cli`, Mocha-only test CLI (**HIGH**).
- [Extension Anatomy](https://code.visualstudio.com/api/get-started/extension-anatomy) — `engines.vscode` ↔ `@types/vscode` relationship (**HIGH**).
- [Source Control in VS Code](https://code.visualstudio.com/docs/editor/versioncontrol) — Git 2.0+ on machine; UI uses system Git (**HIGH** for prerequisite, **MEDIUM** for how much raw Git you still need).
- [`extensions/git/src/api/git.d.ts` (raw)](https://raw.githubusercontent.com/microsoft/vscode/main/extensions/git/src/api/git.d.ts) — `Repository`, `getMergeBase`, `getBranches`, `deleteBranch`, upstream fields (**HIGH**).
- [github.com/microsoft/vscode-vsce/issues/455](https://github.com/microsoft/vscode-vsce/issues/455) — `@types/vscode` vs `engines.vscode` publishing pitfalls (**MEDIUM**).
- **npm registry (`npm view`, 2026-04-14):** `typescript@6.0.2`, `@types/vscode@1.115.0`, `@vscode/vsce@3.7.1`, `esbuild@0.28.0`, `vitest@4.1.4` — used as **current “latest” pins**; re-check before locking `package.json` (**HIGH** for “what npm served that day”, **LOW** as long-term API guarantees).

---
*Stack research for: VS Code/Cursor extension — branch cleanup (gitcleaner-style)*  
*Researched: 2026-04-14*
