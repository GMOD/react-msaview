export interface Control {
  label: string
  action: string
}

export interface KeyControl extends Control {
  keys: string[]
  shiftKey?: boolean
}

const arrows = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']

export const keyboardControls: KeyControl[] = [
  { label: 'Arrow keys', action: 'Scroll one cell', keys: arrows },
  {
    label: 'Shift + arrow keys',
    action: 'Scroll one page',
    keys: arrows,
    shiftKey: true,
  },
  { label: '+ and -', action: 'Zoom in and out', keys: ['+', '=', '-'] },
  {
    label: 'Home and End',
    action: 'Jump to the first and last column',
    keys: ['Home', 'End'],
  },
  { label: 'Escape', action: 'Clear the selection', keys: ['Escape'] },
]

const selectCells: Control = {
  label: 'Shift + drag',
  action: 'Select a block of cells',
}

export const mouseControls: Control[] = [
  { label: 'Drag', action: 'Pan the alignment' },
  {
    label: 'Wheel',
    action: 'Scroll, or zoom as set in Alignment settings → Mouse wheel',
  },
  { label: 'Ctrl + wheel', action: 'Zoom at the cursor' },
  selectCells,
  {
    label: 'Drag along a track',
    action: 'Select a range of columns across every row',
  },
  {
    label: 'Click a tree node',
    action: 'Collapse, rotate, reroot or show only that clade',
  },
  {
    label: 'Click the tree overview',
    action: 'Show only the clade under the pointer',
  },
  { label: 'Drag a divider', action: 'Resize the tree area or a track' },
]

export const alignmentAriaLabel = [
  'Alignment',
  ...[...keyboardControls, selectCells].map(c => `${c.label}: ${c.action}`),
].join('. ')
