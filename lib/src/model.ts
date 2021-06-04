import { Instance, cast, types, addDisposer } from 'mobx-state-tree'
import { hierarchy, cluster, HierarchyNode } from 'd3-hierarchy'
import { ascending, max } from 'd3-array'
import { FileLocation, ElementId } from '@jbrowse/core/util/types/mst'
import { FileLocation as FileLocationType } from '@jbrowse/core/util/types'
import { openLocation } from '@jbrowse/core/util/io'
import { autorun } from 'mobx'
import BaseViewModel from '@jbrowse/core/pluggableElementTypes/models/BaseViewModel'

import Stockholm from 'stockholm-js'
import ClustalMSA from './parsers/ClustalMSA'
import StockholmMSA from './parsers/StockholmMSA'
import FastaMSA from './parsers/FastaMSA'
import parseNewick from './parseNewick'
import { generateNodeIds, NodeWithIds } from './util'

function setBrLength(d: HierarchyNode<any>, y0: number, k: number) {
  //@ts-ignore
  d.len = (y0 += Math.max(d.data.length || 0, 0)) * k
  if (d.children) {
    d.children.forEach((d) => {
      setBrLength(d, y0, k)
    })
  }
}

function maxLength(d: HierarchyNode<any>): number {
  return (d.data.length || 1) + (d.children ? max(d.children, maxLength) : 0)
}

// note: we don't use this.root because it won't update in response to changes
// in realWidth/totalHeight here otherwise, needs to generate a new object
function getRoot(tree: any) {
  return hierarchy(tree, (d) => d.branchset)
    .sum((d) => (d.branchset ? 0 : 1))
    .sort((a, b) => {
      return ascending(a.data.length || 1, b.data.length || 1)
    })
}

function filter(tree: NodeWithIds, collapsed: string[]): NodeWithIds {
  const { branchset, ...rest } = tree
  if (collapsed.includes(tree.id)) {
    return rest
  } else if (branchset) {
    return {
      ...rest,
      branchset: branchset.map((b) => filter(b, collapsed)),
    }
  } else {
    return tree
  }
}

function clamp(min: number, num: number, max: number) {
  return Math.min(Math.max(num, min), max)
}

const model = types.snapshotProcessor(
  types
    .compose(
      BaseViewModel,
      types
        .model('MsaView', {
          id: ElementId,
          type: types.literal('MsaView'),
          height: 680,
          treeAreaWidth: 400,
          treeWidth: 400,
          nameWidth: 200,
          rowHeight: 20,
          scrollY: 0,
          scrollX: 0,
          blockSize: 1000,
          mouseRow: types.maybe(types.number),
          mouseCol: types.maybe(types.number),
          colWidth: 16,
          showBranchLen: true,
          bgColor: true,
          drawTree: false,
          drawNodeBubbles: true,
          colorSchemeName: 'maeditor',
          treeFilehandle: types.maybe(FileLocation),
          msaFilehandle: types.maybe(FileLocation),
          currentAlignment: 0,
          collapsed: types.array(types.string),
          data: types.optional(
            types
              .model({
                tree: types.maybe(types.string),
                msa: types.maybe(types.string),
              })
              .actions((self) => ({
                setTree(tree?: string) {
                  self.tree = tree
                },
                setMSA(msa?: string) {
                  self.msa = msa
                },
              })),
            { tree: '', msa: '' },
          ),
        })
        .volatile(() => ({
          error: undefined as Error | undefined,
          volatileWidth: 0,
          margin: { left: 20, top: 20 },
        }))
        .actions((self) => ({
          setError(error?: Error) {
            self.error = error
          },
          setMousePos(col?: number, row?: number) {
            self.mouseCol = col
            self.mouseRow = row
          },
          setRowHeight(n: number) {
            self.rowHeight = n
          },
          setColWidth(n: number) {
            self.colWidth = n
          },
          setColorSchemeName(name: string) {
            self.colorSchemeName = name
          },
          setScrollY(n: number) {
            self.scrollY = n
          },
          setScrollX(n: number) {
            self.scrollX = n
          },
          setTreeAreaWidth(n: number) {
            self.treeAreaWidth = n
          },
          setTreeWidth(n: number) {
            self.treeWidth = n
          },
          setNameWidth(n: number) {
            self.nameWidth = n
          },
          setCurrentAlignment(n: number) {
            self.currentAlignment = n
          },
          toggleDrawTree() {
            self.drawTree = !self.drawTree
          },
          toggleCollapsed(node: string) {
            if (self.collapsed.includes(node)) {
              self.collapsed.remove(node)
            } else {
              self.collapsed.push(node)
            }
          },
          toggleBranchLen() {
            self.showBranchLen = !self.showBranchLen
          },
          toggleBgColor() {
            self.bgColor = !self.bgColor
          },
          toggleNodeBubbles() {
            self.drawNodeBubbles = !self.drawNodeBubbles
          },
          setData(data: { msa: string; tree: string }) {
            self.data = cast(data)
          },
          setWidth(width: number) {
            self.volatileWidth = width
          },
          async setMSAFilehandle(msaFilehandle?: FileLocationType) {
            if (msaFilehandle && 'blobId' in msaFilehandle) {
              this.setMSA(
                (await openLocation(msaFilehandle).readFile('utf8')) as string,
              )
            } else {
              self.msaFilehandle = msaFilehandle
            }
          },
          async setTreeFilehandle(treeFilehandle?: FileLocationType) {
            if (treeFilehandle && 'blobId' in treeFilehandle) {
              this.setTree(
                (await openLocation(treeFilehandle).readFile('utf8')) as string,
              )
            } else {
              self.treeFilehandle = treeFilehandle
            }
          },
          setMSA(result: string) {
            self.data.setMSA(result)
          },
          setTree(result: string) {
            self.data.setTree(result)
          },

          afterCreate() {
            addDisposer(
              self,
              autorun(async () => {
                const { treeFilehandle } = self
                if (treeFilehandle) {
                  this.setTree(
                    (await openLocation(treeFilehandle).readFile(
                      'utf8',
                    )) as string,
                  )
                }
              }),
            )
            addDisposer(
              self,
              autorun(async () => {
                const { msaFilehandle } = self

                if (msaFilehandle) {
                  this.setMSA(
                    (await openLocation(msaFilehandle).readFile(
                      'utf8',
                    )) as string,
                  )
                }
              }),
            )
          },
        }))
        .views((self) => {
          let oldBlocksX: number[] = []
          let oldBlocksY: number[] = []
          let oldValX = 0
          let oldValY = 0
          return {
            get initialized() {
              return (
                self.data.msa ||
                self.data.tree ||
                self.msaFilehandle ||
                self.treeFilehandle
              )
            },

            get blocksX() {
              const { scrollX, blockSize: size, colWidth } = self
              const ret = -(size * Math.floor(scrollX / size)) - size

              const b = []
              for (let i = ret; i < ret + size * 3; i += size) {
                if (i + size > 0) {
                  b.push(i)
                }
              }
              if (
                JSON.stringify(b) !== JSON.stringify(oldBlocksX) ||
                colWidth !== oldValX
              ) {
                oldBlocksX = b
                oldValX = colWidth
              }
              return oldBlocksX
            },

            get blocksY() {
              const { scrollY, blockSize: size, rowHeight } = self
              const ret = -(size * Math.floor(scrollY / size)) - 2 * size

              const b = []
              for (let i = ret; i < ret + size * 3; i += size) {
                if (i + size > 0) {
                  b.push(i)
                }
              }
              if (
                JSON.stringify(b) !== JSON.stringify(oldBlocksY) ||
                rowHeight !== oldValY
              ) {
                oldBlocksY = b
                oldValY = rowHeight
              }
              return oldBlocksY
            },

            get done() {
              return (
                self.volatileWidth > 0 &&
                this.initialized &&
                (self.data.msa || self.data.tree)
              )
            },

            get alignmentDetails() {
              return this.MSA?.getDetails() || {}
            },

            get currentAlignmentName() {
              return this.alignmentNames[self.currentAlignment]
            },

            get alignmentNames() {
              return this.MSA?.alignmentNames || []
            },

            get noTree() {
              return !!this.tree.noTree
            },

            get menuItems() {
              return []
            },

            get MSA() {
              const text = self.data.msa
              if (text) {
                if (Stockholm.sniff(text)) {
                  return new StockholmMSA(text, self.currentAlignment)
                } else if (text.startsWith('>')) {
                  return new FastaMSA(text)
                } else {
                  return new ClustalMSA(text)
                }
              }
              return null
            },
            get width() {
              return self.volatileWidth
            },

            get numColumns() {
              return (
                ((this.MSA?.getWidth() || 0) - this.blanks.length) *
                self.colWidth
              )
            },

            get tree() {
              const {
                data: { tree },
                collapsed,
              } = self
              const t = tree
                ? generateNodeIds(parseNewick(tree))
                : this.MSA?.getTree()

              if (!self.drawTree) {
                return {
                  id: 'root',
                  noTree: true,
                  branchset: this.MSA?.getNames().map((name) => ({
                    id: name,
                    name,
                  })),
                }
              }
              return t ? filter(t, collapsed) : { noTree: true }
            },

            get rowNames() {
              return this.hierarchy.leaves().map((node) => node.data.name)
            },

            get mouseOverRowName() {
              return self.mouseRow !== undefined
                ? this.rowNames[self.mouseRow]
                : undefined
            },

            get root() {
              return getRoot(this.tree)
            },

            get msaAreaWidth() {
              return this.width - self.treeAreaWidth
            },

            get blanks() {
              const blanks = []
              const strs = this.hierarchy
                .leaves()
                .map(({ data }) => this.MSA?.getRow(data.name))
                .filter((item): item is string[] => !!item)

              for (let i = 0; i < strs[0]?.length; i++) {
                let counter = 0
                for (let j = 0; j < strs.length; j++) {
                  if (strs[j][i] === '-') {
                    counter++
                  }
                }
                if (counter === strs.length) {
                  blanks.push(i)
                }
              }
              return blanks
            },

            get columns(): Record<string, string> {
              const rows = this.hierarchy
                .leaves()
                .map(({ data }) => [data.name, this.MSA?.getRow(data.name)])
                .filter((f) => !!f[1])
              const strs = rows.map((row) => row[1])

              const ret: string[] = []
              for (let i = 0; i < strs.length; i++) {
                let s = ''
                let b = 0
                for (let j = 0; j < strs[i].length; j++) {
                  if (j === this.blanks[b]) {
                    b++
                  } else {
                    s += strs[i][j]
                  }
                }
                ret.push(s)
              }
              return Object.fromEntries(
                rows.map((row, index) => [row[0], ret[index]]),
              )
            },

            // generates a new tree that is clustered with x,y positions
            get hierarchy() {
              const root = getRoot(this.tree)
              const clust = cluster()
                .size([this.totalHeight, self.treeWidth])
                .separation(() => 1)
              clust(root)
              setBrLength(
                root,
                (root.data.length = 0),
                self.treeWidth / maxLength(root),
              )
              return root
            },

            get totalHeight() {
              return this.root.leaves().length * self.rowHeight
            },
          }
        }),
    )
    .actions((self) => ({
      doScrollY(deltaY: number) {
        self.scrollY = clamp(-self.totalHeight + 10, self.scrollY + deltaY, 10)
      },

      doScrollX(deltaX: number) {
        self.scrollX = clamp(
          -self.numColumns + (self.msaAreaWidth - 20),
          self.scrollX + deltaX,
          0,
        )
      },
    })),
  {
    postProcessor(result) {
      const { data, ...rest } = result
      return rest
    },
  },
)

export default model

export type MsaViewStateModel = typeof model
export type MsaViewModel = Instance<MsaViewStateModel>
