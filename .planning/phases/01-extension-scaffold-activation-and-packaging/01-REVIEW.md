---
status: issues
phase: 01-extension-scaffold-activation-and-packaging
reviewed: 2026-04-14T12:00:00Z
depth: standard
files_reviewed: 8
files_reviewed_list:
  - package.json
  - tsconfig.json
  - esbuild.js
  - src/extension.ts
  - README.md
  - .vscodeignore
  - .gitignore
  - LICENSE
findings:
  critical: 0
  warning: 2
  info: 1
  total: 3
---

# Phase 01: Code Review Report

**Reviewed:** 2026-04-14  
**Depth:** standard  
**Files reviewed:** 8  
**Status:** issues (warnings only; no critical findings)

## Summary

Scaffold code (`extension.ts`, `esbuild.js`) is minimal and sound: no unsafe APIs, correct command registration, and production build wiring is reasonable. **Manifest and documentation** need small corrections: `@types/vscode` resolves far ahead of `engines.vscode` in the lockfile, which can cause **vsce** validation or “types say API exists but runtime doesn’t” drift. **README** packaging steps conflate the npm `package` script (esbuild production) with producing a `.vsix`.

## Critical issues

None.

## Warnings

### WR-01: `@types/vscode` vs `engines.vscode` mismatch risk

**File:** `package.json:42` (with lockfile resolution at `package-lock.json:1010-1011`)  
**Issue:** `devDependencies` uses `"@types/vscode": "^1.96.0"`, which resolves to **1.115.0** while `engines.vscode` remains **`^1.96.0`**. That is the common vsce / typings skew pitfall: you can typecheck against APIs not present on the declared minimum editor.  
**Fix:** Either pin typings to the supported line, for example `"@types/vscode": "1.96.0"` or `"~1.96.0"`, **or** raise `engines.vscode` to match the API surface you intentionally support (and re-test on that minimum).

### WR-02: README implies `npm run package` creates a VSIX

**File:** `README.md:27-36`  
**Issue:** Under “Packaging”, the snippet runs `npm run package` in the same flow as “Produce a `.vsix` locally”. In `package.json`, `package` only runs `check-types` and `esbuild.js --production`; it does **not** invoke `vsce`, so no `.vsix` is produced by that command alone.  
**Fix:** State explicitly that the VSIX step is `npx @vscode/vsce package` (or add a dedicated npm script that wraps vsce). Example:

```bash
npm run compile
npx --yes @vscode/vsce@3.7.1 package -o vscode-branch-cleaner-0.0.1.vsix
```

## Info

### IN-01: LICENSE copyright line is incomplete

**File:** `LICENSE:3`  
**Issue:** `Copyright (c) 2026` has no legal entity or person; harmless for a stub but weak for distribution clarity.  
**Fix:** Add the copyright holder, e.g. `Copyright (c) 2026 Your Name or Organization`.

---

_Reviewer: gsd-code-reviewer (standard depth)_
