# Quick task 260414-kwv: Initialize Changesets in repo

## Tasks

### Task 1 — Tooling and config

- **files:** `package.json`, `package-lock.json`, `.changeset/config.json`
- **action:** Add `@changesets/cli` as a devDependency with a pinned version, add npm scripts for `changeset`, `changeset version`, and `changeset publish`. Run `npm install` to refresh the lockfile. Align `.changeset/config.json` with a public single-package repo (`access: public`).
- **verify:** `npx changeset --help` exits 0; `npm run check-types` still passes.
- **done:** [x]
