import * as vscode from 'vscode';
import { BaselineResolutionError } from './domain/types';
import { buildCleanupRunPlan } from './git/cleanupRun';
import { getGitApi } from './git/api';
import { resolveRepositoryForWorkspace } from './git/repositoryPicker';

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
        const merged = plan.candidates.filter((c) => c.merge === 'merged').length;
        const notMerged = plan.candidates.filter((c) => c.merge === 'not_merged').length;
        const unknown = plan.candidates.filter((c) => c.merge === 'unknown').length;
        await vscode.window.showInformationMessage(
          `Branch Cleaner: baseline ${plan.baseline.displayLabel}, ${plan.candidates.length} cleanup candidate(s). Merged: ${merged}, not merged: ${notMerged}, unknown: ${unknown}.`,
        );
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
