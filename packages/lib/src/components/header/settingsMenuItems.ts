import { lazy } from 'react'

import { maxNeighborJoiningRows, treeOrders } from '../../constants.ts'
import { canGoTo } from './GoToBox.tsx'
import { annotationsSubMenu } from './getAnnotationsMenu.ts'

import type { MsaViewModel } from '../../model.ts'
import type { TreeOrder } from '../../types.ts'
import type { MenuItem } from '@jbrowse/core/ui/Menu'

const GapThresholdDialog = lazy(
  () => import('../dialogs/GapThresholdDialog.tsx'),
)
const GoToDialog = lazy(() => import('../dialogs/GoToDialog.tsx'))

function radio(label: string, checked: boolean, onClick: () => void) {
  return { label, type: 'radio' as const, checked, onClick }
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

function subMenu(label: string, items: MenuItem[]) {
  return { label, type: 'subMenu' as const, subMenu: items }
}

// the only place in the UI to turn a hidden track back on
function tracksSubMenu(model: MsaViewModel): MenuItem[] {
  const shown = new Set(model.turnedOnTracks.map(t => t.model.id))
  return model.tracks.map(({ model: { id, name } }) =>
    toggle(name, shown.has(id), () => {
      model.toggleTrack(id)
    }),
  )
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

export function viewMenuItems(model: MsaViewModel): MenuItem[] {
  const { drawMsaLetters, scrollZoom, showColumnStats, noDomains } = model
  return [
    ...(canGoTo(model)
      ? [
          {
            label: 'Go to row or column…',
            onClick: () => {
              model.queueDialog(onClose => [GoToDialog, { model, onClose }])
            },
          },
        ]
      : []),
    subMenu('Tracks', tracksSubMenu(model)),
    subMenu('Gappy columns', gapsSubMenu(model)),
    ...(noDomains ? [] : [subMenu('Annotations', annotationsSubMenu(model))]),
    toggle('Show letters', drawMsaLetters, arg => {
      model.setDrawMsaLetters(arg)
    }),
    toggle('Show track values on hover', showColumnStats, arg => {
      model.setShowColumnStats(arg)
    }),
    toggle('Scroll wheel zooms', scrollZoom, arg => {
      model.setScrollZoom(arg)
    }),
  ]
}

function neighborJoiningItem(model: MsaViewModel): MenuItem {
  const rows = model.rowMap.size
  const tooManyRows = rows > maxNeighborJoiningRows
  return {
    label: tooManyRows
      ? `Build neighbor joining tree (over ${maxNeighborJoiningRows} rows, use FastTree)`
      : model.noTree
        ? 'Build neighbor joining tree'
        : 'Replace with neighbor joining tree',
    disabled: tooManyRows || rows < 2,
    onClick: () => {
      try {
        model.calculateNeighborJoiningTreeFromMSA()
      } catch (e) {
        console.error('Failed to calculate NJ tree:', e)
        model.addWarning(e instanceof Error ? e.message : String(e))
      }
    },
  }
}

export function treeMenuItems(model: MsaViewModel): MenuItem[] {
  if (model.noTree) {
    return [neighborJoiningItem(model)]
  }
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
      ...(rotated.length > 0
        ? [
            {
              label: 'Undo rotations',
              onClick: () => {
                model.clearRotated()
              },
            },
          ]
        : []),
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
      ...(typeof treeRoot === 'object'
        ? [
            {
              ...radio(outgroupLabel(treeRoot.outgroup), true, () => {}),
              disabled: true,
            },
          ]
        : []),
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
    ...(treeAreaWidth === undefined
      ? []
      : [
          {
            label: 'Reset tree width',
            onClick: () => {
              model.setTreeAreaWidth(undefined)
            },
          },
        ]),
    neighborJoiningItem(model),
  ]
}
