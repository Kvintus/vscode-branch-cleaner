---
"vscode-branch-cleaner": patch
---

Align release automation with Changesets: publish runs `changeset publish` before marketplace upload for GitHub Releases, mark package private to skip npm, and require a changeset on pull requests (except the Version Packages branch).
