import type { Repository } from '../types/git';
import type { CleanupCandidateRow } from './cleanupRun';

export type BranchDeletionOutcome = {
  readonly branchName: string;
  readonly ok: boolean;
  readonly errorMessage?: string;
};

export function selectionNeedsRiskConfirmation(selectedRows: readonly CleanupCandidateRow[]): boolean {
  return selectedRows.some((row) => row.merge === 'not_merged' || row.merge === 'unknown');
}

export function formatDeletionReportLines(outcomes: readonly BranchDeletionOutcome[]): string[] {
  const failures = outcomes.filter((o) => !o.ok);
  const successes = outcomes.filter((o) => o.ok);
  const lines: string[] = [];
  for (const o of failures) {
    const msg = o.errorMessage?.trim() ? o.errorMessage : 'Unknown error';
    lines.push(`${o.branchName}: failed — ${msg}`);
  }
  for (const o of successes) {
    lines.push(`${o.branchName}: deleted`);
  }
  return lines;
}

export async function deleteLocalBranchesSequential(
  repository: Repository,
  operations: readonly { readonly branchName: string; readonly force: boolean }[],
): Promise<readonly BranchDeletionOutcome[]> {
  const outcomes: BranchDeletionOutcome[] = [];
  for (const op of operations) {
    try {
      await repository.deleteBranch(op.branchName, op.force);
      outcomes.push({ branchName: op.branchName, ok: true });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      outcomes.push({ branchName: op.branchName, ok: false, errorMessage });
    }
  }
  return outcomes;
}
