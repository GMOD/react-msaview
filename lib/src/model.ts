import {
  Instance,
  cast,
  types,
  addDisposer,
  getSnapshot,
  SnapshotIn,
} from 'mobx-state-tree'
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
import colorSchemes from './colorSchemes'

import gff from '@gmod/gff'

import { generateNodeIds } from './util'
import TextTrack from './components/TextTrack'
import BoxTrack from './components/BoxTrack'

interface BasicTrackModel {
  id: string
  name: string
  associatedRowName?: string
  height: number
}

export interface TextTrackModel extends BasicTrackModel {
  customColorScheme?: { [key: string]: string }
  data: string
}

export interface BoxTrackModel extends BasicTrackModel {
  features: { start: number; end: number }[]
}
export interface TextTrack {
  ReactComponent: React.FC<any>
  model: TextTrackModel
}

export interface BoxTrack {
  ReactComponent: React.FC<any>
  model: BoxTrackModel
}

type BasicTrack = BoxTrack | TextTrack

function skipBlanks(blanks: number[], arg: string) {
  let s = ''
  let b = 0
  for (let j = 0; j < arg.length; j++) {
    if (j === blanks[b]) {
      b++
    } else {
      s += arg[j]
    }
  }
  return s
}

function setBrLength(d: HierarchyNode<any>, y0: number, k: number) {
  //@ts-ignore
  d.len = (y0 += Math.max(d.data.length || 0, 0)) * k
  d.children?.forEach(d => {
    setBrLength(d, y0, k)
  })
}

function maxLength(d: HierarchyNode<any>): number {
  return (d.data.length || 1) + (d.children ? max(d.children, maxLength) : 0)
}

// Collapse the node and all it's children, from
// https://bl.ocks.org/d3noob/43a860bc0024792f8803bba8ca0d5ecd
function collapse(d: HierarchyNode<any>) {
  if (d.children) {
    //@ts-ignore
    d._children = d.children
    //@ts-ignore
    d._children.forEach(collapse)
    //@ts-ignore
    d.children = null
  }
}

function clamp(min: number, num: number, max: number) {
  return Math.min(Math.max(num, min), max)
}

const StructureModel = types.model({
  id: types.identifier,
  structure: types.model({
    pdb: types.string,
    startPos: types.number,
    endPos: types.number,
  }),
  range: types.maybe(types.string),
})

const UniprotTrack = types
  .model({
    id: types.string,
    accession: types.string,
    name: types.string,
    associatedRowName: types.string,
    height: types.optional(types.number, 100),
  })
  .volatile(() => ({
    error: undefined as Error | undefined,
    data: undefined as any | undefined,
  }))
  .actions(self => ({
    setError(error: Error) {
      self.error = error
    },
    setData(data: string) {
      self.data = data
    },
  }))
  .actions(self => ({
    afterCreate() {
      addDisposer(
        self,
        autorun(async () => {
          try {
            const { accession } = self
            const url = `https://www.uniprot.org/uniprot/${accession}.gff`
            const response = await fetch(url)
            if (!response.ok) {
              throw new Error(
                `HTTP ${response.status} ${response.statusText} fetching ${url}`,
              )
            }
            const text = await response.text()
            self.setData(text)
          } catch (e) {
            self.setError(e)
          }
        }),
      )
    },
  }))
  .views(self => ({
    get loading() {
      return !self.data
    },

    get features() {
      return gff.parseStringSync(self.data).map((f: any) => f[0])
    },
  }))

const MSAModel = types
  .model('MsaView', {
    id: ElementId,
    type: types.literal('MsaView'),
    height: types.optional(types.number, 550),
    treeAreaWidth: types.optional(types.number, 400),
    treeWidth: types.optional(types.number, 300),
    rowHeight: 20,
    scrollY: 0,
    scrollX: 0,
    resizeHandleWidth: 5,
    blockSize: 1000,
    mouseRow: types.maybe(types.number),
    mouseCol: types.maybe(types.number),
    selectedStructures: types.array(StructureModel),
    labelsAlignRight: false,
    colWidth: 16,
    showBranchLen: true,
    bgColor: true,
    drawTree: true,
    drawNodeBubbles: true,
    highResScaleFactor: 2,
    colorSchemeName: 'maeditor',
    treeFilehandle: types.maybe(FileLocation),
    msaFilehandle: types.maybe(FileLocation),
    currentAlignment: 0,
    collapsed: types.array(types.string),
    showOnly: types.maybe(types.string),
    boxTracks: types.array(UniprotTrack),
    turnedOffTracks: types.map(types.boolean),
    annotatedRegions: types.array(
      types.model({
        start: types.number,
        end: types.number,
      }),
    ),
    data: types.optional(
      types
        .model({
          tree: types.maybe(types.string),
          msa: types.maybe(types.string),
        })
        .actions(self => ({
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
    margin: { left: 20, top: 20 },
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    DialogComponent: undefined as undefined | React.FC<any>,
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    DialogProps: undefined as any,
  }))
  .actions(self => ({
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    setDialogComponent(dlg: React.FC<any> | undefined, props: any) {
      self.DialogComponent = dlg
      self.DialogProps = props
    },
    setHeight(height: number) {
      self.height = height
    },
    addStructureToSelection(elt: SnapshotIn<typeof StructureModel>) {
      self.selectedStructures.push(elt)
    },
    removeStructureFromSelection(elt: SnapshotIn<typeof StructureModel>) {
      const r = self.selectedStructures.find(node => node.id === elt.id)
      if (r) {
        self.selectedStructures.remove(r)
      }
    },
    toggleStructureSelection(elt: {
      id: string
      structure: { startPos: number; endPos: number; pdb: string }
    }) {
      const r = self.selectedStructures.find(node => node.id === elt.id)
      if (r) {
        self.selectedStructures.remove(r)
      } else {
        self.selectedStructures.push(elt)
      }
    },
    clearSelectedStructures() {
      //@ts-ignore
      self.selectedStructures = []
    },
    setError(error?: Error) {
      console.error(error)
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
    setCurrentAlignment(n: number) {
      self.currentAlignment = n
    },
    toggleLabelsAlignRight() {
      self.labelsAlignRight = !self.labelsAlignRight
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
    setShowOnly(node: string | undefined) {
      self.showOnly = node
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
    setData(data: { msa?: string; tree?: string }) {
      self.data = cast(data)
    },
    async setMSAFilehandle(msaFilehandle?: FileLocationType) {
      self.msaFilehandle = msaFilehandle
    },
    async setTreeFilehandle(treeFilehandle?: FileLocationType) {
      if (treeFilehandle && 'blobId' in treeFilehandle) {
        const r = (await openLocation(treeFilehandle).readFile(
          'utf8',
        )) as string
        this.setTree(r)
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
            try {
              this.setTree(
                (await openLocation(treeFilehandle).readFile('utf8')) as string,
              )
            } catch (e) {
              this.setError(e)
            }
          }
        }),
      )
      addDisposer(
        self,
        autorun(async () => {
          const { msaFilehandle } = self

          if (msaFilehandle) {
            try {
              this.setMSA(
                (await openLocation(msaFilehandle).readFile('utf8')) as string,
              )
            } catch (e) {
              this.setError(e)
            }
          }
        }),
      )
    },
  }))
  .views(self => {
    let oldBlocksX: number[] = []
    let oldBlocksY: number[] = []
    let oldValX = 0
    let oldValY = 0
    return {
      get initialized() {
        return (
          (self.data.msa ||
            self.data.tree ||
            self.msaFilehandle ||
            self.treeFilehandle) &&
          !self.error
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
    }
  })
  .views(self => ({
    get blocks2d() {
      return self.blocksY.map(by => self.blocksX.map(bx => [bx, by])).flat()
    },
    get done() {
      return self.initialized && (self.data.msa || self.data.tree)
    },

    get colorScheme() {
      return colorSchemes[self.colorSchemeName]
    },

    get alignmentDetails() {
      return this.MSA?.getDetails() || {}
    },

    getRowDetails(name: string) {
      //@ts-ignore
      const details = this.MSA?.getRowDetails(name)
      const matches = name.match(/\S+\/(\d+)-(\d+)/)
      return {
        ...details,
        ...(matches && { range: { start: +matches[1], end: +matches[2] } }),
      }
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

    get numColumns() {
      return ((this.MSA?.getWidth() || 0) - this.blanks.length) * self.colWidth
    },

    get tree() {
      return self.data.tree
        ? generateNodeIds(parseNewick(self.data.tree))
        : this.MSA?.getTree() || ({ noTree: true } as any)
    },

    get rowNames(): string[] {
      return this.hierarchy.leaves().map((node: any) => node.data.name)
    },

    get mouseOverRowName() {
      return self.mouseRow !== undefined
        ? this.rowNames[self.mouseRow]
        : undefined
    },

    getMouseOverResidue(rowName: string) {
      return this.columns[rowName]
    },

    get root() {
      let hier = hierarchy(this.tree, (d: any) => d.branchset)
        .sum((d: any) => (d.branchset ? 0 : 1))
        .sort((a: any, b: any) =>
          ascending(a.data.length || 1, b.data.length || 1),
        )
      if (self.showOnly) {
        const res = hier.find((node: any) => node.data.id === self.showOnly)
        if (res) {
          hier = res
        }
      }

      if (self.collapsed.length) {
        self.collapsed
          .map(collapsedId =>
            hier.find((node: any) => node.data.id === collapsedId),
          )
          .filter(f => !!f)
          .map((node: any) => collapse(node))
      }
      return hier
    },

    get structures(): {
      [key: string]: {
        pdb: string
        startPos: number
        endPos: number
      }[]
    } {
      return this.MSA?.getStructures() || {}
    },

    get inverseStructures() {
      const map = Object.entries(this.structures)
        .map(([key, val]) => val.map(pdbEntry => [pdbEntry.pdb, { id: key }]))
        .flat()
      return Object.fromEntries(map)
    },

    get msaAreaWidth() {
      //@ts-ignore
      return self.width - self.treeAreaWidth
    },

    get blanks() {
      const blanks = []
      const strs = this.hierarchy
        .leaves()
        .map(({ data }: any) => this.MSA?.getRow(data.name))
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

    get rows(): string[][] {
      return this.hierarchy
        .leaves()
        .map(({ data }: any) => [data.name, this.MSA?.getRow(data.name)])
        .filter(f => !!f[1])
    },

    get columns(): Record<string, string> {
      const rows = this.rows
      const cols = this.columns2d

      return Object.fromEntries(rows.map((row, index) => [row[0], cols[index]]))
    },

    get columns2d() {
      const strs = this.rows.map(r => r[1])
      const ret: string[] = []
      for (let i = 0; i < strs.length; i++) {
        ret.push(skipBlanks(this.blanks, strs[i]))
      }
      return ret
    },

    // generates a new tree that is clustered with x,y positions
    get hierarchy() {
      const root = this.root
      const clust = cluster()
        .size([this.totalHeight, self.treeWidth])
        .separation(() => 1)
      clust(root)
      setBrLength(
        root,
        //@ts-ignore
        (root.data.length = 0),
        self.treeWidth / maxLength(root),
      )
      return root
    },

    get totalHeight() {
      return this.root.leaves().length * self.rowHeight
    },
  }))
  .actions(self => ({
    addUniprotTrack(node: { name: string; accession: string }) {
      if (self.boxTracks.find(t => t.name === node.name)) {
        if (self.turnedOffTracks.has(node.name)) {
          this.toggleTrack(node.name)
        }
      } else {
        self.boxTracks.push({
          ...node,
          id: node.name,
          associatedRowName: node.name,
        })
      }
    },

    doScrollY(deltaY: number) {
      self.scrollY = clamp(-self.totalHeight + 10, self.scrollY + deltaY, 0)
    },

    doScrollX(deltaX: number) {
      self.scrollX = clamp(
        -self.numColumns + (self.msaAreaWidth - 100),
        self.scrollX + deltaX,
        0,
      )
    },
    setMouseoveredColumn(n: number, chain: string, file: string) {
      let j = 0
      let i = 0
      const { id } = self.inverseStructures[file.slice(0, -4)] || {}
      const row = self.MSA?.getRow(id)

      if (row) {
        for (i = 0; i < row.length && j < n; i++) {
          if (row[i] !== '-') {
            j++
          }
        }
        self.mouseCol = j + 1
      } else {
        self.mouseCol = undefined
      }
    },

    toggleTrack(id: string) {
      if (self.turnedOffTracks.has(id)) {
        self.turnedOffTracks.delete(id)
      } else {
        self.turnedOffTracks.set(id, true)
      }
    },
  }))
  .views(self => ({
    get secondaryStructureConsensus() {
      return self.MSA?.secondaryStructureConsensus
    },

    get seqConsensus() {
      return self.MSA?.seqConsensus
    },

    get conservation() {
      const m = self.columns2d

      if (m.length) {
        for (let i = 0; i < m[0].length; i++) {
          const col = []
          for (let j = 0; j < m.length; j++) {
            col.push(m[j][i])
          }
        }
      }
      return ['a']
    },

    get tracks(): BasicTrack[] {
      const blanks = self.blanks
      const adapterTracks = self.MSA
        ? self.MSA.tracks.map(track => {
            const { data } = track
            return {
              model: {
                ...track,
                data: data ? skipBlanks(blanks, data) : undefined,
                height: self.rowHeight,
              } as TextTrackModel,
              ReactComponent: TextTrack,
            }
          })
        : ([] as BasicTrack[])

      const boxTracks = self.boxTracks
        // filter out tracks that are associated with hidden rows
        .filter(track => !!self.rows.find(row => row[0] === track.name))
        .map(track => ({
          model: track as BoxTrackModel,
          ReactComponent: BoxTrack,
        }))

      const annotationTracks =
        self.annotatedRegions.length > 0
          ? [
              {
                model: {
                  features: self.annotatedRegions,
                  height: 100,
                  id: 'annotations',
                  name: 'User-created annotations',
                } as BoxTrackModel,
                ReactComponent: BoxTrack,
              },
            ]
          : ([] as BasicTrack[])

      return [...adapterTracks, ...boxTracks, ...annotationTracks]
    },

    get turnedOnTracks() {
      return this.tracks.filter(f => !self.turnedOffTracks.has(f.model.id))
    },

    bpToPxForRow(rowName: string, position: number) {
      const { rowNames, rows, blanks } = self
      const index = rowNames.indexOf(rowName)
      const [, row] = rows[index]
      const details = self.getRowDetails(rowName)
      const offset = details.range?.start || 0
      const current = position - offset

      if (current < 0) {
        return 0
      }

      let j = 0
      let i = 0

      for (; i < row.length; i++) {
        if (row[i] !== '-' && j++ === current) {
          break
        }
      }

      let count = 0
      for (let k = 0; k < row.length; k++) {
        if (blanks.indexOf(k) !== -1 && k < i + 1) {
          count++
        }
      }

      return i - count
    },
  }))
  .actions(self => ({
    addAnnotation(start: number, end: number) {
      self.annotatedRegions.push({
        start,
        end,
      })
    },

    addRelativeAnnotation(start: number, end: number) {
      self.annotatedRegions.push({
        start: this.getRealPos(start),
        end: this.getRealPos(end),
      })
    },

    getRealPos(pos: number) {
      let j = 0
      for (let i = 0, k = 0; i < pos; i++, j++) {
        while (j === self.blanks[k]) {
          k++
          j++
        }
      }
      return j
    },
  }))

const model = types.snapshotProcessor(types.compose(BaseViewModel, MSAModel), {
  postProcessor(result) {
    const {
      data: { tree, msa },
      ...rest
    } = result

    // remove the MSA/tree data from the tree if the filehandle available in
    // which case it can be reloaded on refresh
    return {
      data: {
        //https://andreasimonecosta.dev/posts/the-shortest-way-to-conditionally-insert-properties-into-an-object-literal/
        ...(!result.treeFilehandle && { tree }),
        ...(!result.msaFilehandle && { msa }),
      },
      ...rest,
    }
  },
})

export default model

export type MsaViewStateModel = typeof model
export type MsaViewModel = Instance<MsaViewStateModel>
