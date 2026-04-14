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

Produce a `.vsix` locally:

```bash
npm run compile
npm run package
# or explicitly:
npx --yes @vscode/vsce@3.7.1 package -o vscode-branch-cleaner-0.0.1.vsix
```

Install the resulting VSIX from the Extensions view (**Install from VSIX…**).

The `publisher` field in `package.json` is set to `local` for local packaging; publishing to the Marketplace requires a real publisher id.
