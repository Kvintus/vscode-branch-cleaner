---
phase: 01-extension-scaffold-activation-and-packaging
plan: 2
type: execute
wave: 2
depends_on:
  - 1
files_modified:
  - .vscodeignore
  - .gitignore
  - README.md
autonomous: true
requirements:
  - QUAL-02
must_haves:
  truths:
    - "README names Visual Studio Code and Cursor as supported editors and explains engines.vscode as minimum API/host version."
    - "README documents npm run compile and npm run package (or npx vsce package) for typecheck, bundle, and VSIX."
    - ".vscodeignore keeps dist/extension.js packaged and excludes sources/dev noise."
    - "vsce package produces a .vsix at repo root (or documented output path) with exit code 0."
  artifacts:
    - path: README.md
      provides: QUAL-02 editor statement + build instructions
    - path: .vscodeignore
      provides: packaging include/exclude rules
  key_links:
    - from: README.md
      to: package.json scripts
      via: documented script names matching package.json keys exactly
---

<objective>
Document supported editors and version expectations (QUAL-02), finalize `.vscodeignore` and `.gitignore` for packaging hygiene, and prove the VSIX packaging path with `@vscode/vsce`.

Purpose: Closes documentation and supply-chain-safe packaging defaults for Phase 1 success criteria 4–5.

Output: `README.md`, `.vscodeignore`, updated `.gitignore` if needed, optional `*.vsix` artifact (gitignored).
</objective>

<execution_context>
@$HOME/.cursor/get-shit-done/workflows/execute-plan.md
@$HOME/.cursor/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/01-extension-scaffold-activation-and-packaging/01-RESEARCH.md
@package.json (from plan 1)

**QUAL-02:** README must state VS Code + Cursor compatibility and that `engines.vscode` declares the minimum editor API version the extension expects; note Cursor is a VS Code fork and users should run a Cursor build compatible with that engine range.

**.vscodeignore:** Follow official bundling doc: exclude `src/**`, `esbuild.js`, `tsconfig.json`, `.gitignore`, planning dirs optional; **must NOT** exclude `dist/extension.js`. Example negation not needed if patterns are precise.
</context>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Published artifact (.vsix) | End users install bundled JS; contents must match source-built bundle, no unexpected files. |
| Maintainer machine | vsce uses local npm tree; keep dev files out of VSIX via .vscodeignore. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigate |
|-----------|----------|-----------|-------------|----------|
| T-01b-01 | Tampering | VSIX contents differ from intended bundle | mitigate | `.vscodeignore` explicitly include `dist/**` packaging; verify `vsce ls` lists `dist/extension.js`; never ignore `dist/` wholesale with broad `**/*.js`. |
| T-01b-02 | Information disclosure | README or package metadata | accept | No secrets in README; do not document PATs or embed tokens. |
| T-01b-03 | Denial of service | Accidental huge VSIX | mitigate | Ignore `node_modules`, `.planning`, `*.vsix`, source maps optional for prod package per team choice — if minified prod bundle, sourcemaps can be omitted from VSIX via ignore. |
</threat_model>

<tasks>

<task type="auto">
  <name>Task 1: .vscodeignore and .gitignore packaging hygiene</name>
  <files>.vscodeignore, .gitignore</files>
  <read_first>
    - package.json
    - .planning/phases/01-extension-scaffold-activation-and-packaging/01-RESEARCH.md
  </read_first>
  <acceptance_criteria>
    - `test -f .vscodeignore` exits 0.
    - Shell pipeline `rg -v '^#' .vscodeignore | rg '^dist'` exits 1 (second `rg` finds no lines — no non-comment `.vscodeignore` line starts with `dist`, forbidding `dist/**`-style drops of the bundle).
    - `rg -n 'vsix|\\.vsix' .gitignore` matches at least once.
    - `rg -n 'node_modules' .gitignore` matches at least once.
  </acceptance_criteria>
  <action>
    Add `.vscodeignore` excluding development files per 01-RESEARCH Pitfall 1: typical lines `.vscode/**`, `src/**`, `esbuild.js`, `tsconfig.json`, `.gitignore`, `.github/**`, optional `.planning/**`, `**/*.ts`, but **ensure** `dist/extension.js` ships (do not add a line `dist/**` that omits the bundle). Reference official esbuild extension sample ignore list. Update or create root `.gitignore` with `node_modules/`, `dist/` (if bundles not committed — align with plan 01; if dist is committed, remove dist from gitignore), `*.vsix`, `.DS_Store`. **Decision:** Prefer **not** committing `dist/` — add `dist/` to `.gitignore` and document `npm run compile` before `vsce package` in README (plan 2 task 2). If repo already tracks dist, pick one strategy in this task and make compile + package docs match.
  </action>
  <verify>
    <automated>cd /Users/jakobrolik/programming/momentum/gamma/vscode-branch-cleaner && test -f .vscodeignore && test -f .gitignore</automated>
  </verify>
  <done>Ignore files present; VSIX packaging will include bundled entry.</done>
</task>

<task type="auto">
  <name>Task 2: README (QUAL-02) and VSIX packaging proof</name>
  <files>README.md, .gitignore, package.json</files>
  <read_first>
    - package.json
    - .vscodeignore
    - .planning/ROADMAP.md
  </read_first>
  <acceptance_criteria>
    - `rg -n 'Visual Studio Code|VS Code' README.md` has at least one match (case-insensitive acceptable via separate patterns).
    - `rg -n Cursor README.md` matches at least once.
    - `rg -n 'engines\.vscode|engines.vscode' README.md` OR `rg -n "minimum" README.md` with context mentioning version — require literal substring `engines.vscode` in README body explaining minimum host/API.
    - `rg -n 'npm run compile' README.md` matches.
    - `rg -n 'npm run package|vsce package|npx vsce' README.md` at least one matches (document exact commands from package.json).
    - `npx --yes @vscode/vsce@3.7.1 package -o branch-cleaner-0.0.1.vsix` exits 0 **after** `npm run compile` (or use default output name — acceptance: `ls *.vsix` returns one file after command).
  </acceptance_criteria>
  <action>
    Write `README.md` sections: (1) What the extension is (one paragraph from PROJECT.md intent, scaffold disclaimer). (2) **Requirements / supported editors:** state primary targets **Visual Studio Code** and **Cursor** (VS Code fork); state that `package.json` field `engines.vscode` defines the **minimum VS Code API version** the extension is built and tested against; advise using a Cursor/VS Code build compatible with that range. (3) **Development:** Node 20+, clone, `npm install`, `npm run compile` (typecheck `tsc --noEmit` + esbuild bundle), `npm run watch` for dev. (4) **Packaging:** `npm run package` then install VSIX via Extensions view or document `npx @vscode/vsce package`. Do not log or request credentials in README. Run `npm run compile` then run `npx --yes @vscode/vsce@3.7.1 package` (or `npm run package` if script invokes vsce) and confirm `.vsix` created. Add `*.vsix` to `.gitignore` if not already.
  </action>
  <verify>
    <automated>cd /Users/jakobrolik/programming/momentum/gamma/vscode-branch-cleaner && npm run compile && npx --yes @vscode/vsce@3.7.1 ls 2>/dev/null | head -5; npx --yes @vscode/vsce@3.7.1 package</automated>
  </verify>
  <done>README satisfies QUAL-02; VSIX builds successfully.</done>
</task>

</tasks>

<verification>
- Grep README for VS Code, Cursor, engines.vscode explanation.
- `vsce package` (or npm run package) succeeds after compile.
</verification>

<success_criteria>
Roadmap Phase 1 success criteria items 4–5 evidenced by README + working package command.
</success_criteria>

<output>
After completion, create phase plan SUMMARY per execute-plan convention if required.
</output>
