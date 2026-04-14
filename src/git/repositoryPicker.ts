import * as vscode from 'vscode';
import type { API, Repository } from '../types/git';

/** Slash-normalize for comparison; drive-letter paths are compared case-insensitively. */
function normalizeForCompare(fsPath: string): string {
  const trimmed = fsPath.replace(/\\/g, '/').replace(/\/+$/, '');
  return /^[A-Za-z]:\//.test(trimmed) ? trimmed.toLowerCase() : trimmed;
}

function findRepoForFolderRoot(api: API, folderFsPath: string): Repository | undefined {
  const target = normalizeForCompare(folderFsPath);
  return api.repositories.find(
    (repo) => normalizeForCompare(repo.rootUri.fsPath) === target,
  );
}

/**
 * Resolves the Git {@link Repository} for the current workspace per phase-2 CONTEXT:
 * prefer {@link API.getRepository} for the active editor URI, else the workspace folder
 * that contains the editor, else the first workspace folder with an exact root match.
 */
export function resolveRepositoryForWorkspace(api: API): Repository | undefined {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders?.length) {
    return undefined;
  }

  const editor = vscode.window.activeTextEditor;
  if (editor?.document.uri.scheme === 'file') {
    const fromUri = api.getRepository(editor.document.uri);
    if (fromUri) {
      return fromUri;
    }
    const wsFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
    if (wsFolder) {
      const match = findRepoForFolderRoot(api, wsFolder.uri.fsPath);
      if (match) {
        return match;
      }
    }
  }

  for (const folder of folders) {
    const match = findRepoForFolderRoot(api, folder.uri.fsPath);
    if (match) {
      return match;
    }
  }

  return undefined;
}
