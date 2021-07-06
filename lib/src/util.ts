import Color from 'color'
export function transform<T>(
  obj: Record<string, T>,
  cb: (arg0: [string, T]) => [string, T],
) {
  return Object.fromEntries(Object.entries(obj).map(cb))
}

export type Node = { branchset?: Node[] }
export type NodeWithIds = {
  id: string
  branchset?: NodeWithIds[]
  noTree?: boolean
}

export function generateNodeIds(
  tree: Node,
  parent = 'node',
  depth = 0,
): NodeWithIds {
  const id = `${parent}-${depth}`

  return {
    ...tree,
    id,
    branchset: tree.branchset?.map((b, i) =>
      generateNodeIds(b, id + '-' + i, depth + 1),
    ),
  }
}

export function colorContrast(
  colorScheme: { [key: string]: string },
  theme: any,
) {
  return transform(colorScheme, ([letter, color]) => [
    letter,
    theme.palette.getContrastText(Color(color).hex()),
  ])
}
