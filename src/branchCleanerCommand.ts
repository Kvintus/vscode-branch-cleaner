import * as vscode from 'vscode';
import { BaselineResolutionError } from './domain/types';
import { buildCleanupRunPlan } from './git/cleanupRun';
import {
  deleteLocalBranchesSequential,
  formatDeletionReportLines,
  selectionNeedsRiskConfirmation,
} from './git/localBranchDeletion';
import { mergeDetailLine, sortCandidatesForReview } from './git/cleanupReviewPick';
import { getGitApi } from './git/api';
import { resolveRepositoryForWorkspace } from './git/repositoryPicker';
import { buildBranchQuickPickItems, type BranchPickItem } from './cleanupQuickPick';

export function registerCleanupBranchesCommand(context: vscode.ExtensionContext): void {
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
        if (selected === undefined || selected.length === 0) {
          return;
        }
        const picks = selected.filter((item): item is BranchPickItem => 'branchName' in item);
        if (picks.length === 0) {
          return;
        }

        const byBranchName = new Map(plan.candidates.map((row) => [row.branch.name, row] as const));
        const resolved = picks.flatMap((pick) => {
          const row = byBranchName.get(pick.branchName);
          return row ? [{ pick, row } as const] : [];
        });
        if (resolved.length === 0) {
          return;
        }

        const rowsForSelected = resolved.map((r) => r.row);
        if (selectionNeedsRiskConfirmation(rowsForSelected)) {
          const baselineLabel = plan.baseline.displayLabel;
          const risky = resolved.filter(
            (r) => r.row.merge === 'not_merged' || r.row.merge === 'unknown',
          );
          const confirmLines = [
            `These branches are not fully merged (or merge could not be verified) into baseline: ${baselineLabel}.`,
            '',
            ...risky.map(
              (r) => `${r.pick.branchName} — ${mergeDetailLine(r.row.merge, baselineLabel)}`,
            ),
            '',
            'Delete them locally anyway?',
          ];
          const proceed = await vscode.window.showWarningMessage(
            confirmLines.join('\n'),
            { modal: true },
            'Cancel',
            'Delete selected branches',
          );
          if (proceed !== 'Delete selected branches') {
            return;
          }
        }

        const operations = resolved.map(({ pick, row }) => ({
          branchName: pick.branchName,
          force: row.merge !== 'merged',
        }));
        const outcomes = await deleteLocalBranchesSequential(repository, operations);
        const reportBody = formatDeletionReportLines(outcomes).join('\n');
        if (outcomes.some((o) => !o.ok)) {
          await vscode.window.showWarningMessage(reportBody, { modal: true }, 'OK');
        } else {
          await vscode.window.showInformationMessage(reportBody, { modal: true }, 'OK');
        }
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
