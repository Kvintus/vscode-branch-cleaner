import * as vscode from 'vscode';
import { listLocalBranches } from './git/branches';
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

        const branches = await listLocalBranches(repository);
        const headName = repository.state.HEAD?.name ?? '(detached)';
        await vscode.window.showInformationMessage(
          `Branch Cleaner: ${branches.length} local branch(es). HEAD is ${headName}.`,
        );
      } catch (err) {
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
