# VS Code Branch Cleaner

A Visual Studio Code / Cursor extension for reviewing and cleaning local Git branches in a deliberate, gitcleaner-style flow (candidates, merge signal, explicit deletes). This repository is under active development; the current build is a **scaffold** that registers the **Cleanup Branches** command only.

## Requirements / supported editors

The extension targets **Visual Studio Code** and **Cursor**. Cursor is a fork of the VS Code codebase; use a Cursor build whose underlying VS Code engine satisfies the range declared in `package.json` as **`engines.vscode`** — that field is the **minimum VS Code API version** this extension is written and tested against.

## Development

- **Node.js** 20 or newer
- Clone the repository, then:

```bash
npm install
npm run compile
```

`npm run compile` runs `tsc --noEmit` followed by esbuild, producing `dist/extension.js`.

For iterative work:

```bash
npm run watch
```

## Packaging

`npm run package` runs a **production** bundle (typecheck + minified esbuild). It does **not** emit a `.vsix` by itself.

To build a VSIX after compiling:

```bash
npm run compile
npx --yes @vscode/vsce@3.7.1 package -o vscode-branch-cleaner-0.0.1.vsix
```

Install the resulting VSIX from the Extensions view (**Install from VSIX…**).

The `publisher` field in `package.json` is set to `local` for local packaging; publishing to the Marketplace requires a real **publisher id** from [Visual Studio Marketplace](https://marketplace.visualstudio.com/manage) (replace `local` before any real publish).

## Automated Marketplace release (maintainers)

Releases use [Changesets](https://github.com/changesets/changesets) and [`.github/workflows/release.yml`](.github/workflows/release.yml):

1. Merge work that includes a new file under `.changeset/` (run `npx changeset` locally to add one).
2. On `main`, the workflow opens or updates a **Version Packages** pull request (`changeset version` + changelog).
3. After that PR is merged, the next run on `main` executes **`npm run release:marketplace`** (unit tests + `vsce publish`) when Changesets detects a releasable version bump.

**GitHub:** add a repository secret named **`VSCE_PAT`** — a [personal access token](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#azure-devops) from Azure DevOps with **Marketplace (Manage)** scope. The workflow passes it to `vsce` via the `VSCE_PAT` environment variable.

**Local dry run (no upload):** `npm run test:unit && npx vsce package` builds a `.vsix` without publishing.
