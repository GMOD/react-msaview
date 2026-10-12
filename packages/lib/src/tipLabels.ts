import { measureTextCanvas } from './measureTextCanvas.ts'

import type { NodeWithIds } from './types.ts'

// A label's width follows its length closely enough that the widest one is
// among the longest few, so a 230k-tip tree measures this many strings.
const measuredLabels = 100

/** the leaf names of a tree, and its depth in levels from the root */
export function treeTips(tree: NodeWithIds) {
  const names: string[] = []
  let depth = 0
  const stack: [NodeWithIds, number][] = [[tree, 0]]
  for (let entry = stack.pop(); entry; entry = stack.pop()) {
    const [node, level] = entry
    const { children } = node
    if (children.length > 0) {
      for (const child of children) {
        stack.push([child, level + 1])
      }
    } else {
      names.push(node.name)
      depth = Math.max(depth, level)
    }
  }
  return { names, depth }
}

/** the width of the widest label at `fontSize`, measuring the longest few */
export function widestLabel(labels: string[], fontSize: number) {
  const counts: number[] = []
  for (const label of labels) {
    counts[label.length] = (counts[label.length] ?? 0) + 1
  }
  let shortest = counts.length
  for (let seen = 0; shortest > 0 && seen < measuredLabels;) {
    shortest--
    seen += counts[shortest] ?? 0
  }
  let widest = 0
  let ties = 0
  for (const label of labels) {
    if (
      label.length > shortest ||
      (label.length === shortest && ties++ < measuredLabels)
    ) {
      widest = Math.max(widest, measureTextCanvas(label, fontSize))
    }
  }
  return widest
}
