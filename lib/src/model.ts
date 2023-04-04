import { Instance, cast, types, addDisposer, SnapshotIn } from 'mobx-state-tree'
import { hierarchy, cluster, HierarchyNode } from 'd3-hierarchy'
import { ascending } from 'd3-array'
import { FileLocation, ElementId } from '@jbrowse/core/util/types/mst'
import { FileLocation as FileLocationType } from '@jbrowse/core/util/types'
import { openLocation } from '@jbrowse/core/util/io'
import { autorun } from 'mobx'
import BaseViewModel from '@jbrowse/core/pluggableElementTypes/models/BaseViewModel'
import Stockholm from 'stockholm-js'

export interface RowDetails {
  [key: string]: unknown
  name: string
  range?: { start: number; end: number }
}

// locals
import {
  collapse,
  generateNodeIds,
  maxLength,
  setBrLength,
  skipBlanks,
  clamp,
  NodeWithIds,
  NodeWithIdsAndLength,
} from './util'
import TextTrack from './components/TextTrack'
import BoxTrack from './components/BoxTrack'
import ClustalMSA from './parsers/ClustalMSA'
import StockholmMSA from './parsers/StockholmMSA'
import FastaMSA from './parsers/FastaMSA'
import parseNewick from './parseNewick'
import colorSchemes from './colorSchemes'
import { UniprotTrack } from './UniprotTrack'
import { StructureModel } from './StructureModel'

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
export interface ITextTrack {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ReactComponent: React.FC<any>
  model: TextTrackModel
}

export interface IBoxTrack {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ReactComponent: React.FC<any>
  model: BoxTrackModel
}

type BasicTrack = IBoxTrack | ITextTrack

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
        attributes: types.frozen<Record<string, string[]>>(),
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
    error: undefined as unknown,
    margin: { left: 20, top: 20 },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    DialogComponent: undefined as undefined | React.FC<any>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    DialogProps: undefined as any,

    // annotations
    annotPos: undefined as { left: number; right: number } | undefined,
  }))
  .actions(self => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // @ts-expect-error
      self.selectedStructures = []
    },
    setError(error?: unknown) {
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
    setShowOnly(node?: string) {
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
        const r = await openLocation(treeFilehandle).readFile('utf8')
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
              this.setTree(await openLocation(treeFilehandle).readFile('utf8'))
            } catch (e) {
              console.error(e)
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
              this.setMSA(await openLocation(msaFilehandle).readFile('utf8'))
            } catch (e) {
              console.error(e)
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
      return self.blocksY.flatMap(by => self.blocksX.map(bx => [bx, by]))
    },
    get done() {
      return self.initialized && (self.data.msa || self.data.tree)
    },

    get colorScheme() {
      return colorSchemes[self.colorSchemeName]
    },

    get header() {
      return this.MSA?.getHeader() || {}
    },

    getRowData(name: string) {
      const matches = name.match(/\S+\/(\d+)-(\d+)/)
      return {
        data: this.MSA?.getRowData(name) || ({} as Record<string, unknown>),
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

    get tree(): NodeWithIds {
      return self.data.tree
        ? generateNodeIds(parseNewick(self.data.tree))
        : this.MSA?.getTree() || {
            noTree: true,
            branchset: [],
            id: 'empty',
            name: 'empty',
          }
    },

    get rowNames(): string[] {
      return this.hierarchy.leaves().map(node => node.data.name)
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
      let hier = hierarchy(this.tree, d => d.branchset)
        .sum(d => (d.branchset ? 0 : 1))
        .sort((a, b) => ascending(a.data.length || 1, b.data.length || 1))
      if (self.showOnly) {
        const res = hier.find(node => node.data.id === self.showOnly)
        if (res) {
          hier = res
        }
      }

      if (self.collapsed.length) {
        self.collapsed
          .map(collapsedId => hier.find(node => node.data.id === collapsedId))
          .filter((f): f is HierarchyNode<NodeWithIds> => !!f)
          .map(node => collapse(node))
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
      return Object.fromEntries(
        Object.entries(this.structures).flatMap(([key, val]) =>
          val.map(pdbEntry => [pdbEntry.pdb, { id: key }]),
        ),
      )
    },

    get msaAreaWidth() {
      // @ts-expect-error
      return self.width - self.treeAreaWidth
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

    get rows() {
      return this.hierarchy
        .leaves()
        .map(({ data }) => [data.name, this.MSA?.getRow(data.name)] as const)
        .filter((f): f is [string, string[]] => !!f[1])
    },

    get columns() {
      return Object.fromEntries(
        this.rows.map((row, index) => [row[0], this.columns2d[index]] as const),
      )
    },

    get columns2d() {
      return this.rows.map(r => r[1]).map(str => skipBlanks(this.blanks, str))
    },

    get colStats() {
      const r = [] as { [key: string]: number }[]
      const m = this.columns2d
      for (let i = 0; i < m.length; i++) {
        for (let j = 0; j < m[i].length; j++) {
          const l = r[j] || {}
          if (!l[m[i][j]]) {
            l[m[i][j]] = 0
          }
          l[m[i][j]]++
          r[j] = l
        }
      }
      return r
    },

    // generates a new tree that is clustered with x,y positions
    get hierarchy(): HierarchyNode<NodeWithIdsAndLength> {
      const root = this.root
      const clust = cluster()
        .size([this.totalHeight, self.treeWidth])
        .separation(() => 1)
      clust(root)
      setBrLength(
        root,
        (root.data.length = 0),
        self.treeWidth / maxLength(root),
      )
      return root as HierarchyNode<NodeWithIdsAndLength>
    },

    get totalHeight() {
      return this.root.leaves().length * self.rowHeight
    },
  }))
  .actions(self => ({
    addUniprotTrack(node: { name: string; accession: string }) {
      if (self.boxTracks.some(t => t.name === node.name)) {
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
        .filter(track => !!self.rows.some(row => row[0] === track.name))
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
                  data: self.annotatedRegions
                    .map(region => {
                      const attrs = region.attributes
                        ? Object.entries(region.attributes)
                            .map(([k, v]) => `${k}=${v.join(',')}`)
                            .join(';')
                        : '.'
                      return [
                        'MSA_refcoord',
                        '.',
                        '.',
                        region.start,
                        region.end,
                        '.',
                        '.',
                        '.',
                        attrs,
                      ].join('\t')
                    })
                    .join('\n'),
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

    // returns coordinate in the current relative coordinate scheme
    pxToBp(coord: number) {
      return Math.floor((coord - self.scrollX) / self.colWidth)
    },

    rowSpecificBpToPx(rowName: string, position: number) {
      const { rowNames, rows, blanks } = self
      const index = rowNames.indexOf(rowName)
      const row = rows[index][1]
      const details = self.getRowData(rowName)
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
        if (blanks.includes(k) && k < i + 1) {
          count++
        }
      }

      return i - count
    },
    globalBpToPx(position: number) {
      let count = 0
      for (let k = 0; k < self.rows[0]?.[1].length; k++) {
        if (self.blanks.includes(k) && k < position + 1) {
          count++
        }
      }

      return position - count
    },

    relativePxToBp(rowName: string, position: number) {
      const { rowNames, rows } = self
      const index = rowNames.indexOf(rowName)
      const row = rows[index][1]

      let k = 0
      for (let i = 0; i < position; i++) {
        if (row[i] !== '-') {
          k++
        } else if (k >= position) {
          break
        }
      }
      return k
    },

    getPos(pos: number) {
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
  .actions(self => ({
    addAnnotation(
      start: number,
      end: number,
      attributes: { [key: string]: string[] },
    ) {
      self.annotatedRegions.push({
        start: self.getPos(start),
        end: self.getPos(end),
        attributes,
      })
    },

    setOffsets(left: number, right: number) {
      self.annotPos = { left, right }
    },

    clearAnnotPos() {
      self.annotPos = undefined
    },
  }))

const model = types.snapshotProcessor(types.compose(BaseViewModel, MSAModel), {
  postProcessor(result) {
    const snap = result as Omit<typeof result, symbol>
    const {
      data: { tree, msa },
      ...rest
    } = snap

    // remove the MSA/tree data from the tree if the filehandle available in
    // which case it can be reloaded on refresh
    return {
      data: {
        // https://andreasimonecosta.dev/posts/the-shortest-way-to-conditionally-insert-properties-into-an-object-literal/
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
