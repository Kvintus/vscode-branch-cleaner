---
phase: 01-extension-scaffold-activation-and-packaging
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - package.json
  - package-lock.json
  - tsconfig.json
  - esbuild.js
  - src/extension.ts
  - dist/extension.js
autonomous: true
requirements:
  - EXT-01
  - EXT-02
  - EXT-03
  - EXT-04
must_haves:
  truths:
    - "Command Palette lists Git: Cleanup Branches (contributed command id branchCleaner.cleanupBranches)."
    - "activationEvents includes onCommand:branchCleaner.cleanupBranches and workspaceContains:**/.git and does not include asterisk universal activation."
    - "package.json declares extensionDependencies including vscode.git exactly."
    - "npm run compile exits 0 (tsc --noEmit then esbuild to dist/extension.js); main points to dist/extension.js."
    - "engines.vscode caret minimum matches @types/vscode major.minor line (^1.96.0 both per RESEARCH conservative pick)."
  artifacts:
    - path: package.json
      provides: manifest, scripts, contributes, activationEvents, extensionDependencies
    - path: esbuild.js
      provides: bundle pipeline
    - path: src/extension.ts
      provides: activate + registerCommand placeholder
    - path: dist/extension.js
      provides: bundled runtime entry
  key_links:
    - from: package.json contributes.commands[0].command
      to: src/extension.ts registerCommand first argument
      via: identical string branchCleaner.cleanupBranches
    - from: package.json activationEvents onCommand
      to: contributes.commands command id
      via: onCommand:branchCleaner.cleanupBranches
---

<objective>
Establish the npm extension package, VS Code manifest (commands, lazy activation, Git extension dependency), TypeScript + esbuild bundle to `dist/extension.js`, and `vscode:prepublish` / script wiring so maintainers can typecheck and build.

Purpose: Satisfies EXT-01 through EXT-04 before documentation and ignore-file polish in plan 2.

Output: `package.json`, `tsconfig.json`, `esbuild.js`, `src/extension.ts`, generated `dist/extension.js` after `npm run compile`.
</objective>

<execution_context>
@$HOME/.cursor/get-shit-done/workflows/execute-plan.md
@$HOME/.cursor/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/phases/01-extension-scaffold-activation-and-packaging/01-RESEARCH.md
@CLAUDE.md

**Pinned devDependency versions (from 01-RESEARCH.md, 2026-04-14):** `typescript@6.0.2`, `@types/vscode@^1.96.0` (must align same line as `engines.vscode`), `esbuild@0.28.0`, `@vscode/vsce@3.7.1`, `npm-run-all@^4.1.5` (or current patch; pin exact in lockfile via `npm install`).

**Manifest constants:** `name`: `vscode-branch-cleaner`; `publisher`: set to `momentum` (or repo owner string) — **required for `vsce package`**; if unknown use `local` and document in plan-02 README that Marketplace publish needs a real publisher. Actually user didn't specify publisher - I'll use placeholder `local-dev` with acceptance that vsce may warn - better: use `branch-cleaner` as publisher placeholder from product. RESEARCH says vsce needs publisher - I'll action: use `"publisher": "local"` literal unless README says to replace - for vsce 3.x local packaging often works with publisher field present.

Checking: vsce package requires publisher in package.json for marketplace but for local VSIX it might still need it. I'll specify `"publisher": "local"` in action.

**engines.vscode / @types alignment:** Set `"engines": { "vscode": "^1.96.0" }` and `devDependencies["@types/vscode"]: "^1.96.0"` per RESEARCH open question recommendation (conservative ^1.96.0). If executor prefers 1.115 line, both must bump together — acceptance uses same major.minor in both keys.

**esbuild.js:** Node script: `require('esbuild').build({ entryPoints: ['src/extension.ts'], bundle: true, format: 'cjs', platform: 'node', outfile: 'dist/extension.js', external: ['vscode'], sourcemap: !production, minify: production })` with `process.argv.includes('--production')` for production flag matching official sample.
</context>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Supply chain (npm) | Dev dependencies execute during build; runtime bundle must not embed dev tooling. |
| Extension host | Bundled code runs with extension host privileges; keep activation minimal and no secret logging. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-01-01 | Tampering | npm packages (typescript, esbuild, vsce) | mitigate | Pin versions from 01-RESEARCH.md; use `npm ci` in CI; commit `package-lock.json`; review lockfile on bump. |
| T-01-02 | Information disclosure | future logging in extension.ts | mitigate | Do not log tokens or workspace paths in Phase 1; placeholder handler uses static user-facing string only. |
| T-01-03 | Denial of service | activation scope | mitigate | Use `onCommand` + `workspaceContains:**/.git` only — no `*` activation (lazy, host-friendly). |
| T-01-04 | Elevation of unnecessary privilege | bundled code surface | accept | Scaffold only; no network or shell exec in Phase 1. Revisit when Git API wiring lands. |
</threat_model>

<tasks>

<task type="auto">
  <name>Task 1: package.json, tsconfig, and esbuild bundle script</name>
  <files>package.json, package-lock.json, tsconfig.json, esbuild.js</files>
  <read_first>
    - .planning/phases/01-extension-scaffold-activation-and-packaging/01-RESEARCH.md
    - .planning/REQUIREMENTS.md
  </read_first>
  <acceptance_criteria>
    - `rg -n '"Cleanup Branches"' package.json` matches a line in contributes.commands with title Cleanup Branches.
    - `rg -n '"category": "Git"' package.json` returns at least one match.
    - `rg -n 'branchCleaner.cleanupBranches' package.json` returns matches in both contributes.commands and activationEvents onCommand entry.
    - `rg -n 'workspaceContains:\\*\\*/\\.git' package.json` matches OR `rg -n 'workspaceContains' package.json` matches the substring `**/.git` inside the activationEvents string value.
    - `rg -n '"vscode\.git"' package.json` matches inside extensionDependencies array.
    - `rg -n '"\*"' package.json` must NOT match activationEvents universal star (reject literal activationEvents entry `"*"`).
    - `rg -n 'vscode:prepublish' package.json` shows script calling npm run package (or equivalent chain ending in production bundle).
    - `rg -n 'check-types' package.json` and `rg 'tsc --noEmit' package.json` both match.
    - `rg -n '"main":' package.json` shows "./dist/extension.js".
    - `rg -n 'engines' package.json` -A2 shows vscode field with ^1.96.0 (exact caret as authored).
    - `rg -n '@types/vscode' package.json` shows ^1.96.0 (same major.minor as engines.vscode).
    - File `esbuild.js` exists and `rg -n "external: \\['vscode'\\]" esbuild.js` OR `rg "external.*vscode" esbuild.js` matches.
    - File `tsconfig.json` exists and `rg -n '"outDir"' tsconfig.json` is optional; must include `"module"` and `"target"` suitable for extension host (ES2020+ acceptable).
  </acceptance_criteria>
  <action>
    Create greenfield `package.json` with: `name` `vscode-branch-cleaner`, `displayName` `VS Code Branch Cleaner`, `version` `0.0.1`, `publisher` (string required by vsce — use `local` if no org publisher), `engines.vscode` `^1.96.0`, `engines.node` `>=20`, `main` `./dist/extension.js`, `extensionDependencies` `["vscode.git"]`, `contributes.commands` one entry: `command` `branchCleaner.cleanupBranches`, `title` `Cleanup Branches`, `category` `Git`. Set `activationEvents` to `["onCommand:branchCleaner.cleanupBranches","workspaceContains:**/.git"]` (exact JSON string for workspaceContains as in 01-RESEARCH.md). Scripts: `check-types`: `tsc --noEmit`, `compile`: `npm run check-types && node esbuild.js`, `watch`: `npm-run-all -p watch:*`, `watch:esbuild`: `node esbuild.js --watch`, `watch:tsc`: `tsc --noEmit --watch`, `vscode:prepublish`: `npm run package`, `package`: `npm run check-types && node esbuild.js --production`. devDependencies with exact pins from research where sensible: `typescript@6.0.2`, `@types/vscode@^1.96.0`, `esbuild@0.28.0`, `@vscode/vsce@3.7.1`, `npm-run-all@^4.1.5`. Add `scripts.compile` as single entry point for typecheck+bundle. Create `tsconfig.json` with `strict` true, `module` `Node16` or `CommonJS`, `target` `ES2022`, `lib` `ES2022`, `sourceMap` true, `rootDir` `src`, `outDir` omitted or `dist` only if emitting types — prefer noEmit use: set `noEmit` true in tsconfig to match check-types-only flow OR emit declarations disabled; official pattern uses tsc for types only — use `"noEmit": true` in tsconfig. Include `include`: ["src/**/*.ts"]. Create root `esbuild.js` implementing official options: entryPoints `['src/extension.ts']`, bundle true, format `cjs`, platform `node`, outfile `dist/extension.js`, external `['vscode']`, enable `sourcemap` when not `--production`, `minify` when `process.argv.includes('--production')`, watch mode when `process.argv.includes('--watch')` using `context` API or rebuild loop per esbuild docs. Do not add `activationEvents` star. Run `npm install` to produce `package-lock.json`.
  </action>
  <verify>
    <automated>cd /Users/jakobrolik/programming/momentum/gamma/vscode-branch-cleaner && test -f package.json && test -f esbuild.js && test -f tsconfig.json && node -e "JSON.parse(require('fs').readFileSync('package.json','utf8'))"</automated>
  </verify>
  <done>package.json, tsconfig.json, esbuild.js committed; lockfile present; no universal `*` activation.</done>
</task>

<task type="auto">
  <name>Task 2: Extension entrypoint and compile verification</name>
  <files>src/extension.ts, dist/extension.js, .gitignore</files>
  <read_first>
    - package.json
    - esbuild.js
    - .planning/phases/01-extension-scaffold-activation-and-packaging/01-RESEARCH.md
  </read_first>
  <acceptance_criteria>
    - `rg -n "registerCommand\\('branchCleaner.cleanupBranches'" src/extension.ts` matches.
    - `rg -n "export function activate" src/extension.ts` matches.
    - `rg -n "export function deactivate" src/extension.ts` matches.
    - `test -f dist/extension.js` after compile command succeeds.
    - `rg -n "vscode" dist/extension.js` shows only external require pattern (vscode should not be bundled — may appear as require(\"vscode\")).
  </acceptance_criteria>
  <action>
    Implement `src/extension.ts`: import `vscode`, `activate` registers `vscode.commands.registerCommand('branchCleaner.cleanupBranches', async () => { await vscode.window.showInformationMessage('Branch Cleaner: scaffold OK (Cleanup Branches)'); })`, push subscription to context, export empty `deactivate`. Ensure command id string equals `package.json` contributes.commands[0].command. Run `npm run compile` from repo root; fix any tsc or esbuild errors until exit code 0. Ensure `dist/` is gitignored if policy requires (optional .gitignore update in same task only if missing — prefer adding `dist` to .gitignore in plan 02 if cleaner separation; if .gitignore missing, add `node_modules`, `dist`, `*.vsix` in this task to avoid committing bundle noise).
  </action>
  <verify>
    <automated>cd /Users/jakobrolik/programming/momentum/gamma/vscode-branch-cleaner && npm run compile</automated>
  </verify>
  <done>Placeholder command runs at compile time bundle exists; typecheck clean.</done>
</task>

</tasks>

<verification>
- `npm run compile` exits 0.
- `npx vsce ls` or dry-run packaging may fail without README publisher metadata — full VSIX deferred to 02-PLAN if vsce requires files; minimum is compile success.
</verification>

<success_criteria>
EXT-01–EXT-04 satisfied in repository files; Wave 2 can assume working compile.
</success_criteria>

<output>
After completion, create `.planning/phases/01-extension-scaffold-activation-and-packaging/01-01-SUMMARY.md` only if your execute workflow requires it — otherwise follow project SUMMARY naming convention used by execute-plan.
</output>
