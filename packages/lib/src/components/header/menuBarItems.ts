import { lazy } from 'react'

import { maxNeighborJoiningRows, treeOrders } from '../../constants.ts'
import { canGoTo } from './GoToBox.tsx'
import { scrollZoomLabel } from './ScrollZoomCheckbox.tsx'
import { colorSchemeMenuItems } from './colorSchemeMenuItems.tsx'
import { openAnnotationFileItem } from './getAnnotationsMenu.ts'

import type { MsaViewModel } from '../../model.ts'
import type { TreeOrder } from '../../types.ts'
import type { MenuItem } from '@jbrowse/core/ui/Menu'

const AboutDialog = lazy(() => import('../dialogs/AboutDialog.tsx'))
const ExportSVGDialog = lazy(() => import('../dialogs/ExportSVGDialog.tsx'))
const GapThresholdDialog = lazy(
  () => import('../dialogs/GapThresholdDialog.tsx'),
)
const GoToDialog = lazy(() => import('../dialogs/GoToDialog.tsx'))
const HelpDialog = lazy(() => import('../dialogs/HelpDialog.tsx'))
const MetadataDialog = lazy(() => import('../dialogs/MetadataDialog.tsx'))

const tutorialsUrl = 'https://gmod.org/JBrowseMSA/tutorials/'

function radio(label: string, checked: boolean, onClick: () => void) {
  return { label, type: 'radio' as const, checked, onClick }
}

function toggle(label: string, checked: boolean, set: (arg: boolean) => void) {
  return {
    label,
    type: 'checkbox' as const,
    checked,
    onClick: () => {
      set(!checked)
    },
  }
}

function action(label: string, onClick: () => void, disabled = false) {
  return { label, onClick, disabled }
}

function subMenu(label: string, items: MenuItem[]) {
  return { label, type: 'subMenu' as const, subMenu: items }
}

function when<T>(cond: boolean, items: T[]) {
  return cond ? items : []
}

export function fileMenuItems(model: MsaViewModel): MenuItem[] {
  return [
    ...when(!!model.importForm, [
      action('Open alignment…', () => {
        model.reset()
      }),
    ]),
    openAnnotationFileItem(model),
    action('Export as SVG…', () => {
      model.queueDialog(onClose => [ExportSVGDialog, { onClose, model }])
    }),
    ...when(!model.tree.noTree, [
      action('Export tree as Newick', () => {
        model.exportNewick()
      }),
    ]),
    action('Alignment info…', () => {
      model.queueDialog(onClose => [MetadataDialog, { model, onClose }])
    }),
  ]
}

function zoomSubMenu(model: MsaViewModel): MenuItem[] {
  return [
    action('Zoom in', () => {
      model.zoomIn()
    }),
    action('Zoom out', () => {
      model.zoomOut()
    }),
    action('Fit to window', () => {
      model.fit()
    }),
    action('Fit width', () => {
      model.fitHorizontally()
    }),
    action('Fit height', () => {
      model.fitVertically()
    }),
    action('Reset zoom', () => {
      model.resetZoom()
    }),
    toggle(scrollZoomLabel, model.scrollZoom, arg => {
      model.setScrollZoom(arg)
    }),
  ]
}

export const gapPresets = [100, 90, 50]

export function gapsSubMenu(model: MsaViewModel): MenuItem[] {
  const { hideGaps, allowedGappyness } = model
  const custom = hideGaps && !gapPresets.includes(allowedGappyness)
  return [
    radio('Show all columns', !hideGaps, () => {
      model.setHideGaps(false)
    }),
    ...gapPresets.map(pct =>
      radio(
        pct === 100 ? 'Hide columns of only gaps' : `Hide ≥${pct}% gaps`,
        hideGaps && allowedGappyness === pct,
        () => {
          model.setHideGaps(true)
          model.setAllowedGappyness(pct)
        },
      ),
    ),
    {
      ...radio(
        custom ? `Hide ≥${allowedGappyness}% gaps…` : 'Custom threshold…',
        custom,
        () => {
          model.setHideGaps(true)
          model.queueDialog(onClose => [GapThresholdDialog, { model, onClose }])
        },
      ),
      keepMenuOpen: false,
    },
  ]
}

const treeOrderLabels: Record<TreeOrder, string> = {
  branchLength: 'By branch length',
  input: 'As written',
  ladderize: 'Ladderize, small clades first',
  ladderizeReverse: 'Ladderize, large clades first',
}

function outgroupLabel(outgroup: string[]) {
  const [first, ...rest] = outgroup
  return rest.length === 0
    ? `Outgroup ${first}`
    : `Outgroup ${first} … ${rest.at(-1)}`
}

export function treeSubMenu(model: MsaViewModel): MenuItem[] {
  const {
    drawTree,
    showBranchLen,
    labelsAlignRight,
    drawNodeLabels,
    drawLabels,
    treeAreaWidth,
    showTreeOverview,
    showTreeScaleBar,
    treeOrder,
    treeRoot,
    rotated,
  } = model
  return [
    radio('Phylogram', drawTree && showBranchLen, () => {
      model.setDrawTree(true)
      model.setShowBranchLen(true)
    }),
    radio('Cladogram', drawTree && !showBranchLen, () => {
      model.setDrawTree(true)
      model.setShowBranchLen(false)
    }),
    radio('Labels only', !drawTree, () => {
      model.setDrawTree(false)
    }),
    subMenu('Order', [
      ...treeOrders.map(order =>
        radio(treeOrderLabels[order], treeOrder === order, () => {
          model.setTreeOrder(order)
        }),
      ),
      ...when(rotated.length > 0, [
        action('Undo rotations', () => {
          model.clearRotated()
        }),
      ]),
    ]),
    subMenu('Root', [
      radio('As written', treeRoot === undefined, () => {
        model.setTreeRoot(undefined)
      }),
      radio('Midpoint', treeRoot === 'midpoint', () => {
        model.setTreeRoot('midpoint')
      }),
      // "Reroot here" in a node's menu sets the outgroup, so this only
      // reports it
      ...when(typeof treeRoot === 'object', [
        {
          ...radio(
            typeof treeRoot === 'object'
              ? outgroupLabel(treeRoot.outgroup)
              : '',
            true,
            () => {},
          ),
          disabled: true,
        },
      ]),
    ]),
    subMenu('Labels', [
      toggle('Tip labels', drawLabels, arg => {
        model.setDrawLabels(arg)
      }),
      toggle('Internal node labels', drawNodeLabels, arg => {
        model.setDrawNodeLabels(arg)
      }),
      toggle('Align right', labelsAlignRight, arg => {
        model.setLabelsAlignRight(arg)
      }),
    ]),
    toggle('Tree overview', showTreeOverview, arg => {
      model.setShowTreeOverview(arg)
    }),
    toggle('Show tree scale bar', showTreeScaleBar, arg => {
      model.setShowTreeScaleBar(arg)
    }),
    ...when(treeAreaWidth !== undefined, [
      action('Reset tree width', () => {
        model.setTreeAreaWidth(undefined)
      }),
    ]),
  ]
}

export function viewMenuItems(model: MsaViewModel): MenuItem[] {
  return [
    ...when(canGoTo(model), [
      action('Find row or column…', () => {
        model.queueDialog(onClose => [GoToDialog, { model, onClose }])
      }),
    ]),
    subMenu('Zoom', zoomSubMenu(model)),
    toggle('Settings panel', model.settingsOpen, arg => {
      model.setSettingsOpen(arg)
    }),
  ]
}

// the settings panel's toggles for how the alignment draws
export function alignmentSettingsItems(model: MsaViewModel): MenuItem[] {
  const { drawMsaLetters, showColumnStats } = model
  return [
    toggle('Show letters', drawMsaLetters, arg => {
      model.setDrawMsaLetters(arg)
    }),
    toggle('Show track values on hover', showColumnStats, arg => {
      model.setShowColumnStats(arg)
    }),
  ]
}

// who colors the cells comes first, since a scheme picked while the domains
// fill them would otherwise change nothing on screen
export function colorSettingsItems(model: MsaViewModel): MenuItem[] {
  const { cellFill, allAnnotations } = model
  return [
    { type: 'subHeader', label: 'Fill cells with' },
    radio('Residue colors', cellFill === 'residue', () => {
      model.setCellFill('residue')
    }),
    ...when(allAnnotations.length > 0, [
      radio('Domain colors', cellFill === 'domain', () => {
        model.setShowDomains(true)
        model.setCellFill('domain')
      }),
    ]),
    radio('Nothing, color the letters', cellFill === 'none', () => {
      model.setCellFill('none')
    }),
    { type: 'subHeader', label: 'Residue scheme' },
    ...colorSchemeMenuItems(model),
  ]
}

function neighborJoiningItem(model: MsaViewModel): MenuItem {
  const rows = model.rowMap.size
  const tooManyRows = rows > maxNeighborJoiningRows
  return action(
    tooManyRows
      ? `Build neighbor joining tree (over ${maxNeighborJoiningRows} rows, use FastTree)`
      : model.noTree
        ? 'Build neighbor joining tree'
        : 'Replace with neighbor joining tree',
    () => {
      try {
        model.calculateNeighborJoiningTreeFromMSA()
      } catch (e) {
        console.error('Failed to calculate NJ tree:', e)
        model.addWarning(e instanceof Error ? e.message : String(e))
      }
    },
    tooManyRows || rows < 2,
  )
}

export function toolsMenuItems(model: MsaViewModel): MenuItem[] {
  return [neighborJoiningItem(model)]
}

export function helpMenuItems(model: MsaViewModel): MenuItem[] {
  return [
    action('Mouse & keyboard…', () => {
      model.queueDialog(onClose => [HelpDialog, { model, onClose }])
    }),
    action('Tutorials', () => {
      window.open(tutorialsUrl, '_blank', 'noopener,noreferrer')
    }),
    action('About & credits…', () => {
      model.queueDialog(onClose => [AboutDialog, { onClose }])
    }),
  ]
}
