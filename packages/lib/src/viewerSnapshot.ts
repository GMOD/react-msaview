import { createJBrowseTheme } from '@jbrowse/core/ui/theme'

import type { MSAViewerProps } from './components/MSAViewer.tsx'
import type { ColorScheme } from './types.ts'

export function colorSchemeSnapshot(scheme: ColorScheme | undefined) {
  return typeof scheme === 'string'
    ? { colorSchemeName: scheme }
    : scheme
      ? { customColorScheme: scheme.map }
      : {}
}

export function resolveTheme(theme: MSAViewerProps['theme']) {
  return createJBrowseTheme(
    theme === 'dark'
      ? { palette: { mode: 'dark' } }
      : typeof theme === 'object'
        ? theme
        : undefined,
  )
}

/**
 * The model snapshot `MSAViewer` creates from its props. The CLI's `--props`
 * reads the same JSON the R and Python widgets send, so a figure exported
 * headlessly draws what the widget drew.
 */
export function viewerSnapshot({
  msa,
  tree,
  gff,
  rowData,
  msaFilehandle,
  treeFilehandle,
  gffFilehandle,
  colorScheme,
  height,
  colWidth,
  rowHeight,
  allowedGappyness,
  highlightColumns,
  highlights,
  features,
  selection,
  clades,
  relativeTo,
  columnTracks,
  residueMappings,
  encodings,
  rowPanels,
  drawTree,
  treeAreaWidth,
  showBranchLen,
  treeOrder,
  treeRoot,
  region,
  residueEncoding,
}: MSAViewerProps) {
  return {
    type: 'MsaView' as const,
    ...(msa || tree || gff || rowData
      ? {
          data: {
            msa: msa ?? '',
            tree: tree ?? '',
            gff,
            // the row table is stored as this JSON string, which is what a
            // shared URL and the size limit already cover
            ...(rowData ? { treeMetadata: JSON.stringify(rowData) } : {}),
          },
        }
      : {}),
    ...(msaFilehandle ? { msaFilehandle } : {}),
    ...(treeFilehandle ? { treeFilehandle } : {}),
    ...(gffFilehandle ? { gffFilehandle } : {}),
    ...colorSchemeSnapshot(colorScheme),
    ...(height ? { height } : {}),
    ...(colWidth ? { colWidth } : {}),
    ...(rowHeight ? { rowHeight } : {}),
    ...(allowedGappyness !== undefined ? { allowedGappyness } : {}),
    ...(highlightColumns ? { highlightColumns } : {}),
    ...(highlights ? { highlights } : {}),
    ...(features ? { features } : {}),
    ...(selection ? { selection } : {}),
    ...(clades ? { clades } : {}),
    ...(relativeTo ? { relativeTo } : {}),
    ...(columnTracks ? { columnTracks } : {}),
    ...(residueMappings ? { residueMappings } : {}),
    ...(encodings ? { encodings } : {}),
    ...(rowPanels ? { rowPanels } : {}),
    ...(drawTree !== undefined ? { drawTree } : {}),
    ...(treeAreaWidth ? { treeAreaWidth } : {}),
    ...(showBranchLen !== undefined ? { showBranchLen } : {}),
    ...(treeOrder ? { treeOrder } : {}),
    ...(treeRoot ? { treeRoot } : {}),
    ...(region ? { region } : {}),
    ...(residueEncoding !== undefined
      ? { bgColor: residueEncoding === 'fill' }
      : {}),
  }
}
