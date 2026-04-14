import * as vscode from 'vscode';
import type { CleanupCandidateRow } from './git/cleanupRun';
import { mergeDetailLine } from './git/cleanupReviewPick';
import { mergeRowIconUri } from './mergeRowIcons';

export type BranchPickItem = vscode.QuickPickItem & { readonly branchName: string };

type MergeGroupKey = CleanupCandidateRow['merge'];

const MERGE_GROUPS: readonly { readonly key: MergeGroupKey; readonly separatorLabel: string }[] = [
  { key: 'merged', separatorLabel: 'Merged into baseline' },
  { key: 'not_merged', separatorLabel: 'Not merged into baseline' },
  { key: 'unknown', separatorLabel: 'Could not verify merge' },
] as const;

export function buildBranchQuickPickItems(
  extensionUri: vscode.Uri,
  sorted: readonly CleanupCandidateRow[],
  baselineDisplayLabel: string,
): (vscode.QuickPickItem | BranchPickItem)[] {
  return MERGE_GROUPS.flatMap(({ key, separatorLabel }) => {
    const rows = sorted.filter((r) => r.merge === key);
    if (rows.length === 0) {
      return [];
    }
    return [
      {
        kind: vscode.QuickPickItemKind.Separator,
        label: separatorLabel,
      },
      ...rows.map(
        (row): BranchPickItem => ({
          kind: vscode.QuickPickItemKind.Default,
          label: row.branch.name,
          detail: mergeDetailLine(row.merge, baselineDisplayLabel),
          iconPath: mergeRowIconUri(extensionUri, row.merge),
          picked: row.merge === 'merged',
          branchName: row.branch.name,
        }),
      ),
    ];
  });
}
