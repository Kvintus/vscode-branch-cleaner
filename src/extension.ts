import * as vscode from 'vscode';
import { BaselineResolutionError } from './domain/types';
import { buildCleanupRunPlan } from './git/cleanupRun';
import { mergeDetailLine, sortCandidatesForReview } from './git/cleanupReviewPick';
import { getGitApi } from './git/api';
import { resolveRepositoryForWorkspace } from './git/repositoryPicker';

type BranchPickItem = vscode.QuickPickItem & { readonly branchName: string };

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
        const items: BranchPickItem[] = sorted.map((row) => {
          const iconId =
            row.merge === 'merged' ? 'pass' : row.merge === 'not_merged' ? 'error' : 'question';
          return {
            label: row.branch.name,
            detail: mergeDetailLine(row.merge, plan.baseline.displayLabel),
            iconPath: new vscode.ThemeIcon(iconId),
            branchName: row.branch.name,
          };
        });

        const selected = await vscode.window.showQuickPick(items, {
          canPickMany: true,
          matchOnDetail: true,
          title: `Branch Cleaner — baseline: ${plan.baseline.displayLabel}`,
          placeHolder: `Select branches for the next step (baseline ${plan.baseline.displayLabel}). Space toggles selection; Esc cancels. No branches are deleted in this step.`,
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
