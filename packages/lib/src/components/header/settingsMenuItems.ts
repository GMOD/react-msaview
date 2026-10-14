import { treeOrders } from '../../constants.ts'
import {
  MouseScroll,
  MouseZoomBoth,
  MouseZoomHorizontal,
  MouseZoomVertical,
} from './ScrollZoomIcons.tsx'

import type { ScrollZoomAxis } from '../../constants.ts'
import type { MsaViewModel } from '../../model.ts'
import type { TreeOrder } from '../../types.ts'
import type { MenuItem } from '@jbrowse/core/ui/Menu'

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

// the only place in the UI to turn a hidden track back on
function tracksSubMenu(model: MsaViewModel): MenuItem[] {
  const shown = new Set(model.turnedOnTracks.map(t => t.model.id))
  return model.tracks.map(({ model: { id, name } }) =>
    toggle(name, shown.has(id), () => {
      model.toggleTrack(id)
    }),
  )
}

const wheelModes: {
  label: string
  axis?: ScrollZoomAxis
  icon: typeof MouseScroll
  helpText: string
}[] = [
  {
    label: 'Scrolls the alignment',
    icon: MouseScroll,
    helpText: 'Ctrl+wheel zooms both axes at the cursor.',
  },
  {
    label: 'Zooms both axes',
    axis: 'both',
    icon: MouseZoomBoth,
    helpText: 'Hold shift to pan while the wheel zooms.',
  },
  {
    label: 'Zooms columns only',
    axis: 'horizontal',
    icon: MouseZoomHorizontal,
    helpText:
      'Holds the row height, so the labels and letters stay at their size while the alignment compresses.',
  },
  {
    label: 'Zooms rows only',
    axis: 'vertical',
    icon: MouseZoomVertical,
    helpText:
      'Holds the column width, so the alignment stays as wide while the rows grow or shrink.',
  },
]

export function wheelSubMenu(model: MsaViewModel): MenuItem[] {
  const active = model.scrollZoom ? model.scrollZoomAxis : undefined
  return wheelModes.map(({ label, axis, icon, helpText }) => ({
    ...radio(label, axis === active, () => {
      model.setScrollZoom(axis !== undefined)
      if (axis !== undefined) {
        model.setScrollZoomAxis(axis)
      }
    }),
    icon,
    helpText,
  }))
}

export function msaSettingsMenuItems(model: MsaViewModel): MenuItem[] {
  const { drawMsaLetters, hideGaps, bgColor, showColumnStats } = model
  return [
    {
      label: 'Tracks',
      type: 'subMenu' as const,
      subMenu: tracksSubMenu(model),
    },
    {
      label: 'Mouse wheel',
      type: 'subMenu' as const,
      subMenu: wheelSubMenu(model),
    },
    { type: 'divider' as const },
    toggle('Show track values on hover', showColumnStats, arg => {
      model.setShowColumnStats(arg)
    }),
    toggle('Draw letters', drawMsaLetters, arg => {
      model.setDrawMsaLetters(arg)
    }),
    // inverted: bgColor colors the tile, and off colors the letter
    toggle('Color letters, not cells', !bgColor, arg => {
      model.setBgColor(!arg)
    }),
    toggle('Hide gappy columns', hideGaps, arg => {
      model.setHideGaps(arg)
    }),
  ]
}

export function treeSettingsMenuItems(model: MsaViewModel): MenuItem[] {
  const {
    drawTree,
    showBranchLen,
    labelsAlignRight,
    drawNodeBubbles,
    drawNodeLabels,
    drawLabels,
    treeAreaWidth,
    showTreeOverview,
    treeOrder,
    treeRoot,
    rotated,
  } = model
  return [
    {
      label: 'Order',
      type: 'subMenu' as const,
      subMenu: [
        ...treeOrders.map(order =>
          radio(treeOrderLabels[order], treeOrder === order, () => {
            model.setTreeOrder(order)
          }),
        ),
        { type: 'divider' as const },
        {
          label: 'Undo rotations',
          disabled: rotated.length === 0,
          onClick: () => {
            model.clearRotated()
          },
        },
      ],
    },
    {
      label: 'Root',
      type: 'subMenu' as const,
      subMenu: [
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
      ],
    },
    { type: 'divider' as const },
    toggle('Show branch length', showBranchLen, arg => {
      model.setShowBranchLen(arg)
    }),
    toggle('Show tree', drawTree, arg => {
      model.setDrawTree(arg)
    }),
    toggle('Draw bubbles on tree branches', drawNodeBubbles, arg => {
      model.setDrawNodeBubbles(arg)
    }),
    toggle('Draw internal node labels', drawNodeLabels, arg => {
      model.setDrawNodeLabels(arg)
    }),
    toggle('Show tree overview', showTreeOverview, arg => {
      model.setShowTreeOverview(arg)
    }),
    toggle('Tree labels align right', labelsAlignRight, arg => {
      model.setLabelsAlignRight(arg)
    }),
    toggle('Draw labels', drawLabels, arg => {
      model.setDrawLabels(arg)
    }),
    toggle(
      'Fit tree area to labels and tree',
      treeAreaWidth === undefined,
      arg => {
        model.setTreeAreaWidth(arg ? undefined : model.effectiveTreeAreaWidth)
      },
    ),
  ]
}
