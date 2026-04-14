import * as vscode from 'vscode';

export type MergeRowState = 'merged' | 'not_merged' | 'unknown';

function useDarkIconVariant(kind: vscode.ColorThemeKind): boolean {
  return (
    kind === vscode.ColorThemeKind.Dark ||
    kind === vscode.ColorThemeKind.HighContrast
  );
}

const MERGE_ICON_STEM: Record<MergeRowState, string> = {
  merged: 'merge-merged',
  not_merged: 'merge-not-merged',
  unknown: 'merge-unknown',
};

/**
 * QuickPick row icons: `ThemeIcon` colors are not applied to `QuickPickItem.iconPath`
 * (codicons are forced to `--vscode-icon-foreground`). Bundled SVGs use Lucide Git-style
 * glyphs (lucide-static v0.554.0, ISC): **GitMerge** (merged), **GitBranch** (not merged),
 * **GitCompare** (merge unknown / needs comparison) — strokes tinted like testing / warning.
 * @see https://github.com/microsoft/vscode/issues/231218
 */
export function mergeRowIconUri(extensionUri: vscode.Uri, merge: MergeRowState): vscode.Uri {
  const stem = MERGE_ICON_STEM[merge];
  const tone = useDarkIconVariant(vscode.window.activeColorTheme.kind) ? 'dark' : 'light';
  return vscode.Uri.joinPath(extensionUri, 'media', `${stem}-${tone}.svg`);
}
