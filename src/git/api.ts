import * as vscode from 'vscode';
import type { API, GitExtension } from '../types/git';

export async function getGitApi(): Promise<API> {
  const extension = vscode.extensions.getExtension<GitExtension>('vscode.git');
  if (!extension) {
    throw new Error(
      'Branch Cleaner: the built-in Git extension was not found. Install or enable **Git** in VS Code.',
    );
  }

  if (!extension.isActive) {
    await extension.activate();
  }

  const gitExtension = extension.exports;
  if (!gitExtension.enabled) {
    throw new Error(
      'Branch Cleaner: Git is disabled in this window. Enable **Git: Enabled** (or equivalent) to use Cleanup Branches.',
    );
  }

  return gitExtension.getAPI(1);
}
