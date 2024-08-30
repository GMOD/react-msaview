import type { NodeWithIds } from './util'

export function reparseTree(tree: NodeWithIds): NodeWithIds {
  return {
    ...tree,
    children: tree.children.map(r =>
      r.children.length
        ? reparseTree(r)
        : {
            children: [r],
            id: `${r.id}-leafnode`,
            name: `${r.name}-hidden`,
          },
    ),
  }
}
