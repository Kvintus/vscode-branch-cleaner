import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext): void {
  const disposable = vscode.commands.registerCommand(
    'branchCleaner.cleanupBranches',
    async () => {
      await vscode.window.showInformationMessage(
        'Branch Cleaner: scaffold OK (Cleanup Branches)',
      );
    },
  );
  context.subscriptions.push(disposable);
}

export function deactivate(): void {}
