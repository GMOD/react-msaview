import type { NodeWithIds } from './util'

export function reparseTree(tree: NodeWithIds): NodeWithIds {
  return {
    ...tree,
    branchset: tree.branchset.map(r =>
      r.branchset.length
        ? reparseTree(r)
        : {
            branchset: [r],
            id: `${r.id}-leafnode`,
            name: `${r.name}-hidden`,
          },
    ),
  }
}
