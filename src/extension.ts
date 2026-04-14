import * as vscode from 'vscode';
import { BaselineResolutionError } from './domain/types';
import { buildCleanupRunPlan, type CleanupCandidateRow } from './git/cleanupRun';
import { mergeDetailLine, sortCandidatesForReview } from './git/cleanupReviewPick';
import { getGitApi } from './git/api';
import { mergeRowIconUri } from './mergeRowIcons';
import { resolveRepositoryForWorkspace } from './git/repositoryPicker';

type BranchPickItem = vscode.QuickPickItem & { readonly branchName: string };

type MergeGroupKey = CleanupCandidateRow['merge'];

const MERGE_GROUPS: readonly { readonly key: MergeGroupKey; readonly separatorLabel: string }[] = [
  { key: 'merged', separatorLabel: 'Merged into baseline' },
  { key: 'not_merged', separatorLabel: 'Not merged into baseline' },
  { key: 'unknown', separatorLabel: 'Could not verify merge' },
] as const;

function buildBranchQuickPickItems(
  extensionUri: vscode.Uri,
  sorted: readonly CleanupCandidateRow[],
  baselineDisplayLabel: string,
): (vscode.QuickPickItem | BranchPickItem)[] {
  const out: (vscode.QuickPickItem | BranchPickItem)[] = [];
  for (const { key, separatorLabel } of MERGE_GROUPS) {
    const rows = sorted.filter((r) => r.merge === key);
    if (rows.length === 0) {
      continue;
    }
    out.push({
      kind: vscode.QuickPickItemKind.Separator,
      label: separatorLabel,
    });
    for (const row of rows) {
      out.push({
        kind: vscode.QuickPickItemKind.Default,
        label: row.branch.name,
        detail: mergeDetailLine(row.merge, baselineDisplayLabel),
        iconPath: mergeRowIconUri(extensionUri, row.merge),
        picked: row.merge === 'merged',
        branchName: row.branch.name,
      });
    }
  }
  return out;
}

export function activate(context: vscode.ExtensionContext): void {
  const disposable = vscode.commands.registerCommand(
    'branchCleaner.cleanupBranches',
    async () => {
      try {
        const git = await getGitApi();
        const repository = resolveRepositoryForWorkspace(git);
        if (!repository) {
          await vscode.window.showErrorMessage(
            'Branch Cleaner: no Git repository matches the workspace folder. Open a folder that contains a Git checkout.',
          );
          return;
        }

        const plan = await buildCleanupRunPlan(repository);
        if (plan.candidates.length === 0) {
          await vscode.window.showInformationMessage(
            'Branch Cleaner: no cleanup candidates for this repository.',
          );
          return;
        }

        const sorted = sortCandidatesForReview(plan.candidates);
        const items = buildBranchQuickPickItems(context.extensionUri, sorted, plan.baseline.displayLabel);

        const selected = await vscode.window.showQuickPick(items, {
          canPickMany: true,
          matchOnDetail: true,
          title: `Branch Cleaner — baseline: ${plan.baseline.displayLabel}`,
          placeHolder: `Select branches for the next step (baseline ${plan.baseline.displayLabel}). Merged branches start selected. Space toggles selection; Esc cancels. No branches are deleted in this step.`,
        });
        if (selected === undefined) {
          return;
        }
        void selected;
      } catch (err) {
        if (err instanceof BaselineResolutionError) {
          await vscode.window.showErrorMessage(
            'Branch Cleaner: cannot resolve default branch from remote refs (missing origin/HEAD, main, master, and other heads).',
          );
          return;
        }
        const message = err instanceof Error ? err.message : String(err);
        await vscode.window.showErrorMessage(
          message.startsWith('Branch Cleaner:') ? message : `Branch Cleaner: ${message}`,
        );
      }
    },
  );
  context.subscriptions.push(disposable);
}

export function deactivate(): void {}
