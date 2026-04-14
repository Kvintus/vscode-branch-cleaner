import * as vscode from 'vscode';
import { registerCleanupBranchesCommand } from './branchCleanerCommand';

export function activate(context: vscode.ExtensionContext): void {
  registerCleanupBranchesCommand(context);
}

export function deactivate(): void {}
