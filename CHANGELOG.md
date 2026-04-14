# vscode-branch-cleaner

## 0.1.6

### Patch Changes

- eb60c3e: Align release automation with Changesets: publish runs `changeset publish` before marketplace upload for GitHub Releases, mark package private to skip npm, and require a changeset on pull requests (except the Version Packages branch).

## 0.1.0

### Minor Changes

- Add multi-select QuickPick for reviewing cleanup candidates: baseline in title and placeholder, per-row merge detail, and git-branch codicons tinted by merge state. Empty candidate sets show an information message only (no picker).
