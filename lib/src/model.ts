import BaseViewModel from '@jbrowse/core/pluggableElementTypes/models/BaseViewModel'
import * as Clustal from 'clustal-js'
import { hierarchy, cluster, HierarchyNode } from 'd3-hierarchy'
import { ascending, max } from 'd3-array'
import parseNewick from './parseNewick'
import Stockholm from 'stockholm-js'
import { Instance, cast, types, addDisposer } from 'mobx-state-tree'
import { FileLocation, ElementId } from '@jbrowse/core/util/types/mst'
import { FileLocation as FileLocationType } from '@jbrowse/core/util/types'

import { openLocation } from '@jbrowse/core/util/io'
import { autorun } from 'mobx'

class ClustalMSA {
  private MSA: {
    header: Record<string, any>
    alns: { id: string; seq: string }[]
  }

  constructor(text: string) {
    this.MSA = Clustal.parse(text)
  }

  getMSA() {
    return this.MSA
  }

  getRow(name: string) {
    return this.MSA.alns.find((aln) => aln.id === name)?.seq.split('')
  }

  getWidth() {
    return this.MSA.alns[0].seq.length
  }

  getDetails() {
    return this.MSA.header
  }

  get alignmentNames() {
    return []
  }

  getTree() {
    return {
      name: 'root',
      noTree: true,
      branchset: this.MSA.alns.map((aln) => ({
        name: aln.id,
      })),
    }
  }
}

type StrMap = { [key: string]: string }
class FastaMSA {
  private MSA: { seqdata: { [key: string]: string } }
  constructor(text: string) {
    const seq: StrMap = {}
    let name = ''
    const re = /^>(\S+)/
    text.split('\n').forEach((line) => {
      const match = re.exec(line)
      if (match) {
        seq[(name = match[1])] = ''
      } else if (name) {
        seq[name] = seq[name] + line.replace(/[ \t]/g, '')
      }
    })
    this.MSA = { seqdata: seq }
  }

  getMSA() {
    return this.MSA
  }

  getRow(name: string) {
    return this.MSA?.seqdata[name]?.split('')
  }

  getWidth() {
    const name = Object.keys(this.MSA?.seqdata)[0]
    return this.getRow(name).length
  }

  get alignmentNames() {
    return []
  }

  getDetails() {
    return {}
  }

  getTree() {
    return {
      name: 'root',
      noTree: true,
      branchset: Object.keys(this.MSA.seqdata).map((name) => ({
        name,
      })),
    }
  }
}
type StockholmEntry = {
  gf: {
    DE?: string[]
    NH?: string[]
  }
  seqdata: { [key: string]: string }
}

class StockholmMSA {
  private data: StockholmEntry[]
  private MSA: StockholmEntry

  constructor(text: string, currentAlignment: number) {
    const res = Stockholm.parseAll(text)
    this.data = res
    this.MSA = res[currentAlignment]
  }

  getMSA() {
    return this.MSA
  }

  getRow(name: string) {
    return this.MSA?.seqdata[name]?.split('')
  }

  getWidth() {
    const name = Object.keys(this.MSA?.seqdata)[0]
    return this.getRow(name).length
  }

  get alignmentNames() {
    return this.data.map(
      (aln, index) => aln.gf.DE?.[0] || `Alignment ${index + 1}`,
    )
  }

  getDetails() {
    return this.MSA.gf
  }

  getTree() {
    const tree = this.MSA?.gf?.NH?.[0]
    return tree
      ? generateNodeIds(parseNewick(tree))
      : {
          name: 'root',
          noTree: true,
          branchset: Object.keys(this.MSA.seqdata).map((name) => ({
            name,
          })),
        }
  }
}

function setBrLength(d: HierarchyNode<any>, y0: number, k: number) {
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
function getRoot(tree: HierarchyNode<any>) {
  return hierarchy(tree, (d) => d.branchset)
    .sum((d) => (d.branchset ? 0 : 1))
    .sort((a, b) => {
      return ascending(a.data.length || 1, b.data.length || 1)
    })
}

function generateNodeIds(tree: any, parent = 'node', depth = 0, index = 0) {
  tree.id = `${parent}-${depth}-${index}`
  if (tree.branchset?.length) {
    tree.branchset.forEach((b: any, index: number) =>
      generateNodeIds(b, tree.id, depth + 1, index),
    )
  }

  return tree
}
function filter(tree: any, collapsed: string[]) {
  const { branchset, ...rest } = tree
  if (collapsed.includes(tree.id)) {
    return rest
  } else if (tree.branchset) {
    return {
      ...rest,
      branchset: branchset.map((b: any) => filter(b, collapsed)),
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
          treeAreaWidth: 600,
          nameWidth: 200,
          rowHeight: 20,
          scrollY: 0,
          scrollX: 0,
          blockSize: 1000,
          colWidth: 16,
          showBranchLen: true,
          bgColor: true,
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
          setTreeWidth(n: number) {
            self.treeAreaWidth = n
          },
          setNameWidth(n: number) {
            self.nameWidth = n
          },
          setCurrentAlignment(n: number) {
            self.currentAlignment = n
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

            get msaWidth() {
              return (this.MSA?.getWidth() - this.blanks.length) * self.colWidth
            },

            get tree() {
              const {
                data: { tree },
                collapsed,
              } = self
              return filter(
                tree ? generateNodeIds(parseNewick(tree)) : this.MSA?.getTree(),
                collapsed,
              )
            },

            get root() {
              return getRoot(this.tree)
            },

            get treeWidthMinusNames() {
              return self.treeAreaWidth - self.nameWidth
            },

            get treeWidth() {
              return this.noTree ? self.nameWidth : self.treeAreaWidth
            },

            get blanks() {
              const nodes = this.hierarchy.leaves()
              const blanks = []
              const strs = nodes
                .map(({ data }) => this.MSA?.getRow(data.name))
                .filter((f) => !!f)

              for (let i = 0; i < strs?.[0].length; i++) {
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
              const nodes = this.hierarchy.leaves()
              const rows = nodes
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
                .size([this.totalHeight, this.treeWidthMinusNames])
                .separation(() => 1)
              clust(root)
              setBrLength(
                root,
                (root.data.length = 0),
                this.treeWidthMinusNames / maxLength(root),
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
          -self.msaWidth + (self.width - self.treeWidth - 20),
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
