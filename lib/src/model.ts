import React from 'react'
import { autorun } from 'mobx'
import { Instance, cast, types, addDisposer, SnapshotIn } from 'mobx-state-tree'
import { hierarchy, cluster, HierarchyNode } from 'd3-hierarchy'
import { ascending } from 'd3-array'
import Stockholm from 'stockholm-js'
import { saveAs } from 'file-saver'
// jbrowse
import { FileLocation, ElementId } from '@jbrowse/core/util/types/mst'
import { FileLocation as FileLocationType } from '@jbrowse/core/util/types'
import { openLocation } from '@jbrowse/core/util/io'
import { measureText, notEmpty, sum } from '@jbrowse/core/util'
import BaseViewModel from '@jbrowse/core/pluggableElementTypes/models/BaseViewModel'

// locals
import {
  clamp,
  collapse,
  filterHiddenLeafNodes,
  generateNodeIds,
  maxLength,
  setBrLength,
  skipBlanks,
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
import { DialogQueueSessionMixin } from './DialogQueue'
import { renderToSvg } from './renderToSvg'
import { Theme } from '@mui/material'

export interface RowDetails {
  [key: string]: unknown
  name: string
  range?: { start: number; end: number }
}

interface BasicTrackModel {
  id: string
  name: string
  associatedRowName?: string
  height: number
}
interface Structure {
  pdb: string
  startPos: number
  endPos: number
}

export interface TextTrackModel extends BasicTrackModel {
  customColorScheme?: Record<string, string>
  data: string
}

export interface BoxTrackModel extends BasicTrackModel {
  features: {
    start: number
    end: number
  }[]
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
type StructureSnap = SnapshotIn<typeof StructureModel>

/**
 * #stateModel MsaView
 * extends
 * - BaseViewModel
 * - DialogQueueSessionMixin
 */
function x() {} // eslint-disable-line @typescript-eslint/no-unused-vars

export type DialogComponentType =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | React.LazyExoticComponent<React.FC<any>>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | React.FC<any>

const model = types
  .compose(
    BaseViewModel,
    DialogQueueSessionMixin(),
    types.model('MsaView', {
      /**
       * #property
       * id of view, randomly generated if not provided
       */
      id: ElementId,

      /**
       * #property
       * hardcoded view type
       */
      type: types.literal('MsaView'),

      /**
       * #property
       * height of the div containing the view, px
       */
      height: types.optional(types.number, 550),

      /**
       * #property
       * width of the area the tree is drawn in, px
       */
      treeAreaWidth: types.optional(types.number, 400),

      /**
       * #property
       * width of the tree within the treeArea, px
       */
      treeWidth: types.optional(types.number, 300),

      /**
       * #getter
       * synchronization that matches treeWidth to treeAreaWidth
       */
      treeWidthMatchesArea: true,

      /**
       * #property
       * height of each row, px
       */
      rowHeight: 20,

      /**
       * #property
       * scroll position, Y-offset, px
       */
      scrollY: 0,

      /**
       * #property
       * scroll position, X-offset, px
       */
      scrollX: 0,

      /**
       * #property
       * currently "selected" structures, generally PDB 3-D protein structures
       */
      selectedStructures: types.array(StructureModel),

      /**
       * #property
       * right-align the labels
       */
      labelsAlignRight: false,

      /**
       * #property
       * width of columns, px
       */
      colWidth: 16,

      /**
       * #property
       * use "branch length" e.g. evolutionary distance to draw tree branch
       * lengths. if false, the layout is a "cladogram" that does not take into
       * account evolutionary distances
       */
      showBranchLen: true,
      /**
       * #property
       * draw MSA tiles with a background color
       */
      bgColor: true,

      /**
       * #property
       * draw tree, boolean
       */
      drawTree: true,

      /**
       * #property
       * draw clickable node bubbles on the tree
       */
      drawNodeBubbles: true,

      /**
       * #property
       * high resolution scale factor, helps make canvas look better on hi-dpi
       * screens
       */
      highResScaleFactor: 2,

      /**
       * #property
       * default color scheme name
       */
      colorSchemeName: 'maeditor',

      /**
       * #property
       * filehandle object for the tree
       */
      treeFilehandle: types.maybe(FileLocation),

      /**
       * #property
       * filehandle object for the MSA (which could contain a tree e.g. with
       * stockholm files)
       */
      msaFilehandle: types.maybe(FileLocation),

      /**
       * #property
       * filehandle object for tree metadata
       */
      treeMetadataFilehandle: types.maybe(FileLocation),

      /**
       * #property
       *
       */
      currentAlignment: 0,

      /**
       * #property
       * array of tree nodes that are 'collapsed'
       */
      collapsed: types.array(types.string),

      /**
       * #property
       * array of leaf nodes that are 'hidden', similar to collapsed but for leaf nodes
       */
      hidden: types.array(types.string),

      /**
       * #property
       * focus on particular subtree
       */
      showOnly: types.maybe(types.string),

      /**
       * #property
       * a list of "tracks" to display, as box-like glyphs (e.g. protein
       * domains)
       */
      boxTracks: types.array(UniprotTrack),

      /**
       * #property
       * turned off tracks
       */
      turnedOffTracks: types.map(types.boolean),

      /**
       * #property
       * data from the loaded tree/msa/treeMetadata, generally loaded by
       * autorun
       */
      data: types.optional(
        types
          .model({
            tree: types.maybe(types.string),
            msa: types.maybe(types.string),
            treeMetadata: types.maybe(types.string),
          })
          .actions(self => ({
            setTree(tree?: string) {
              self.tree = tree
            },
            setMSA(msa?: string) {
              self.msa = msa
            },
            setTreeMetadata(treeMetadata?: string) {
              self.treeMetadata = treeMetadata
            },
          })),
        { tree: '', msa: '' },
      ),
    }),
  )
  .volatile(() => ({
    /**
     * #volatile
     * resize handle width between tree and msa area, px
     */
    resizeHandleWidth: 5,

    /**
     * #volatile
     * size of blocks of content to be drawn, px
     */
    blockSize: 1000,

    /**
     * #volatile
     * the currently mouse-hovered row
     */
    mouseRow: undefined as number | undefined,

    /**
     * #volatile
     * the currently mouse-hovered column
     */
    mouseCol: undefined as number | undefined,

    /**
     * #volatile
     * a dummy variable that is incremented when ref changes so autorun for
     * drawing canvas commands will run
     */
    nref: 0,

    /**
     * #volatile
     */
    minimapHeight: 56,

    /**
     * #volatile
     */
    error: undefined as unknown,

    /**
     * #volatile
     */
    margin: {
      left: 20,
      top: 20,
    },

    /**
     * #volatile
     */
    annotPos: undefined as { left: number; right: number } | undefined,
  }))
  .actions(self => ({
    /**
     * #action
     * set the height of the view in px
     */
    setHeight(height: number) {
      self.height = height
    },

    /**
     * #action
     * add to the selected structures
     */
    addStructureToSelection(elt: StructureSnap) {
      self.selectedStructures.push(elt)
    },

    /**
     * #action
     * remove from the selected structures
     */
    removeStructureFromSelection(elt: StructureSnap) {
      const r = self.selectedStructures.find(node => node.id === elt.id)
      if (r) {
        self.selectedStructures.remove(r)
      }
    },

    /**
     * #action
     * toggle a structure from the selected structures list
     */
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

    /**
     * #action
     * clear all selected structures
     */
    clearSelectedStructures() {
      self.selectedStructures = cast([])
    },

    /**
     * #action
     * set error state
     */
    setError(error?: unknown) {
      self.error = error
    },

    /**
     * #action
     * set mouse position (row, column) in the MSA
     */
    setMousePos(col?: number, row?: number) {
      self.mouseCol = col
      self.mouseRow = row
    },

    /**
     * #action
     * set row height (px)
     */
    setRowHeight(n: number) {
      self.rowHeight = n
    },

    /**
     * #action
     * set col width (px)
     */
    setColWidth(n: number) {
      self.colWidth = n
    },

    /**
     * #action
     * set color scheme name
     */
    setColorSchemeName(name: string) {
      self.colorSchemeName = name
    },

    /**
     * #action
     * synchronize the treewidth and treeareawidth
     */
    setTreeWidthMatchesArea(arg: boolean) {
      self.treeWidthMatchesArea = arg
    },

    /**
     * #action
     * set scroll Y-offset (px)
     */
    setScrollY(n: number) {
      self.scrollY = n
    },

    /**
     * #action
     * set tree area width (px)
     */
    setTreeAreaWidth(n: number) {
      self.treeAreaWidth = n
    },
    /**
     * #action
     * set tree width (px)
     */
    setTreeWidth(n: number) {
      self.treeWidth = n
    },

    /**
     * #action
     *
     */
    setCurrentAlignment(n: number) {
      self.currentAlignment = n
    },

    /**
     * #action
     */
    setLabelsAlignRight(arg: boolean) {
      self.labelsAlignRight = arg
    },
    /**
     * #action
     */
    setDrawTree(arg: boolean) {
      self.drawTree = arg
    },

    /**
     * #action
     */
    hideNode(arg: string) {
      self.hidden.push(arg)
    },

    /**
     * #action
     */
    clearHidden() {
      self.hidden.clear()
    },

    /**
     * #action
     */
    toggleCollapsed(node: string) {
      if (self.collapsed.includes(node)) {
        self.collapsed.remove(node)
      } else {
        self.collapsed.push(node)
      }
    },

    /**
     * #action
     */
    setShowOnly(node?: string) {
      self.showOnly = node
    },

    /**
     * #action
     */
    setShowBranchLen(arg: boolean) {
      self.showBranchLen = arg
    },

    /**
     * #action
     */
    setBgColor(arg: boolean) {
      self.bgColor = arg
    },

    /**
     * #action
     */
    setDrawNodeBubbles(arg: boolean) {
      self.drawNodeBubbles = arg
    },

    /**
     * #action
     */
    setData(data: { msa?: string; tree?: string }) {
      self.data = cast(data)
    },

    /**
     * #action
     */
    async setMSAFilehandle(msaFilehandle?: FileLocationType) {
      self.msaFilehandle = msaFilehandle
    },

    /**
     * #action
     */
    async setTreeFilehandle(treeFilehandle?: FileLocationType) {
      if (treeFilehandle && 'blobId' in treeFilehandle) {
        const r = await openLocation(treeFilehandle).readFile('utf8')
        this.setTree(r)
      } else {
        self.treeFilehandle = treeFilehandle
      }
    },

    /**
     * #action
     */
    setMSA(result: string) {
      self.data.setMSA(result)
    },

    /**
     * #action
     */
    setTree(result: string) {
      self.data.setTree(result)
    },

    /**
     * #action
     */
    setTreeMetadata(result: string) {
      self.data.setTreeMetadata(result)
    },
  }))

  .views(self => {
    let oldBlocksX: number[] = []
    let oldBlocksY: number[] = []
    let oldValX = 0
    let oldValY = 0
    return {
      /**
       * #getter
       */
      get initialized() {
        return (
          (self.data.msa ||
            self.data.tree ||
            self.msaFilehandle ||
            self.treeFilehandle) &&
          !self.error
        )
      },
      /**
       * #getter
       */
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
      /**
       * #getter
       */
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
    /**
     * #getter
     */
    get blocks2d() {
      return self.blocksY.flatMap(by => self.blocksX.map(bx => [bx, by]))
    },

    /**
     * #getter
     */
    get done() {
      return self.initialized && (self.data.msa || self.data.tree)
    },

    /**
     * #getter
     */
    get colorScheme() {
      return colorSchemes[self.colorSchemeName]
    },

    /**
     * #getter
     */
    get header() {
      return this.MSA?.getHeader() || {}
    },

    /**
     * #method
     */
    getRowData(name: string) {
      const matches = name.match(/\S+\/(\d+)-(\d+)/)
      return {
        data: this.MSA?.getRowData(name) || ({} as Record<string, unknown>),
        ...(matches && {
          range: {
            start: +matches[1],
            end: +matches[2],
          },
        }),
      }
    },
    /**
     * #getter
     */
    get currentAlignmentName() {
      return this.alignmentNames[self.currentAlignment]
    },
    /**
     * #getter
     */
    get alignmentNames() {
      return this.MSA?.alignmentNames || []
    },
    /**
     * #getter
     */
    get noTree() {
      return !!this._tree.noTree
    },
    /**
     * #getter
     */
    get menuItems() {
      return []
    },
    /**
     * #getter
     */
    get treeMetadata() {
      return self.data.treeMetadata ? JSON.parse(self.data.treeMetadata) : {}
    },
    /**
     * #getter
     */
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
    /**
     * #getter
     */
    get numColumns() {
      return (this.MSA?.getWidth() || 0) - this.blanks.length
    },
    /**
     * #getter
     */
    get _tree(): NodeWithIds {
      return self.data.tree
        ? generateNodeIds(parseNewick(self.data.tree))
        : this.MSA?.getTree() || {
            noTree: true,
            branchset: [],
            id: 'empty',
            name: 'empty',
          }
    },
    /**
     * #getter
     */
    get rowNames(): string[] {
      return this.hierarchy.leaves().map(node => node.data.name)
    },
    /**
     * #getter
     */
    get mouseOverRowName() {
      return self.mouseRow !== undefined
        ? this.rowNames[self.mouseRow]
        : undefined
    },

    /**
     * #method
     */
    getMouseOverResidue(rowName: string) {
      return this.columns[rowName]
    },

    /**
     * #getter
     */
    get root() {
      let hier = hierarchy(this._tree, d => d.branchset)
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
          .filter(notEmpty)
          .map(node => collapse(node))
      }
      if (self.hidden.length) {
        self.hidden
          .map(hiddenId => hier.find(node => node.data.id === hiddenId))
          .filter(notEmpty)
          .map(node => filterHiddenLeafNodes(node.parent, node.id))
      }
      return hier
    },
    /**
     * #getter
     */
    get structures(): Record<string, Structure[]> {
      return this.MSA?.getStructures() || {}
    },
    /**
     * #getter
     */
    get inverseStructures() {
      return Object.fromEntries(
        Object.entries(this.structures).flatMap(([key, val]) =>
          val.map(pdbEntry => [pdbEntry.pdb, { id: key }]),
        ),
      )
    },
    /**
     * #getter
     * widget width minus the tree area gives the space for the MSA
     */
    get msaAreaWidth() {
      return self.width - self.treeAreaWidth
    },
    /**
     * #getter
     */
    get blanks() {
      const blanks = []
      const strs = this.hierarchy
        .leaves()
        .map(leaf => this.MSA?.getRow(leaf.data.name))
        .filter((item): item is string => !!item)

      for (let i = 0; i < strs[0]?.length; i++) {
        let counter = 0
        for (const str of strs) {
          if (str[i] === '-') {
            counter++
          }
        }
        if (counter === strs.length) {
          blanks.push(i)
        }
      }
      return blanks
    },
    /**
     * #getter
     */
    get rows() {
      const MSA = this.MSA
      return this.hierarchy
        .leaves()
        .map(leaf => [leaf.data.name, MSA?.getRow(leaf.data.name)] as const)
        .filter((f): f is [string, string] => !!f[1])
    },
    /**
     * #getter
     */
    get columns() {
      return Object.fromEntries(
        this.rows.map((row, index) => [row[0], this.columns2d[index]] as const),
      )
    },
    /**
     * #getter
     */
    get columns2d() {
      return this.rows.map(r => r[1]).map(str => skipBlanks(this.blanks, str))
    },
    /**
     * #getter
     */
    get fontSize() {
      return Math.max(8, self.rowHeight - 8)
    },
    /**
     * #getter
     */
    get colStats() {
      const r = [] as Record<string, number>[]
      const columns = this.columns2d
      for (const column of columns) {
        for (let j = 0; j < column.length; j++) {
          const l = r[j] || {}
          if (!l[column[j]]) {
            l[column[j]] = 0
          }
          l[column[j]]++
          r[j] = l
        }
      }
      return r
    },
    /**
     * #getter
     * generates a new tree that is clustered with x,y positions
     */
    get hierarchy(): HierarchyNode<NodeWithIdsAndLength> {
      const r = this.root
      const clust = cluster<NodeWithIds>()
        .size([this.totalHeight, self.treeWidth])
        .separation(() => 1)
      clust(r)
      setBrLength(r, (r.data.length = 0), self.treeWidth / maxLength(r))
      return r as HierarchyNode<NodeWithIdsAndLength>
    },

    /**
     * #getter
     */
    get totalHeight() {
      return this.root.leaves().length * self.rowHeight
    },
  }))
  .actions(self => ({
    /**
     * #action
     */
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

    /**
     * #action
     */
    doScrollY(deltaY: number) {
      self.scrollY = clamp(-self.totalHeight + 10, self.scrollY + deltaY, 0)
    },

    /**
     * #action
     */
    doScrollX(deltaX: number) {
      self.scrollX = clamp(
        -(self.numColumns * self.colWidth) + (self.msaAreaWidth - 100),
        self.scrollX + deltaX,
        0,
      )
    },

    /**
     * #action
     */
    setScrollX(n: number) {
      console.log({ n })
      self.scrollX = clamp(
        -(self.numColumns * self.colWidth) + (self.msaAreaWidth - 100),
        n,
        0,
      )
    },

    /**
     * #action
     */
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
    /**
     * #action
     */
    toggleTrack(id: string) {
      if (self.turnedOffTracks.has(id)) {
        self.turnedOffTracks.delete(id)
      } else {
        self.turnedOffTracks.set(id, true)
      }
    },
  }))
  .views(self => ({
    /**
     * #getter
     */
    get labelsWidth() {
      let x = 0
      const { rowHeight, hierarchy, treeMetadata, fontSize } = self
      if (rowHeight > 5) {
        for (const node of hierarchy.leaves()) {
          x = Math.max(
            measureText(
              treeMetadata[node.data.name]?.genome || node.data.name,
              fontSize,
            ),
            x,
          )
        }
      }
      return x
    },

    /**
     * #getter
     */
    get secondaryStructureConsensus() {
      return self.MSA?.secondaryStructureConsensus
    },

    /**
     * #getter
     */
    get seqConsensus() {
      return self.MSA?.seqConsensus
    },

    /**
     * #getter
     */
    get conservation() {
      if (self.columns2d.length) {
        for (let i = 0; i < self.columns2d[0].length; i++) {
          const col = []
          for (const column of self.columns2d) {
            col.push(column[i])
          }
        }
      }
      return ['a']
    },

    /**
     * #getter
     */
    get adapterTrackModels(): BasicTrack[] {
      return (
        self.MSA?.tracks.map(t => ({
          model: {
            ...t,
            data: t.data ? skipBlanks(self.blanks, t.data) : undefined,
            height: self.rowHeight,
          } as TextTrackModel,
          ReactComponent: TextTrack,
        })) || []
      )
    },

    /**
     * #getter
     */
    get boxTrackModels(): BasicTrack[] {
      return self.boxTracks
        .filter(track => self.rows.some(row => row[0] === track.name))
        .map(track => ({
          model: track as BoxTrackModel,
          ReactComponent: BoxTrack,
        }))
    },

    /**
     * #getter
     */
    get tracks(): BasicTrack[] {
      return [...this.adapterTrackModels, ...this.boxTrackModels]
    },
    /**
     * #getter
     */
    get turnedOnTracks() {
      return this.tracks.filter(f => !self.turnedOffTracks.has(f.model.id))
    },

    /**
     * #method
     * returns coordinate in the current relative coordinate scheme
     */
    pxToBp(coord: number) {
      return Math.floor((coord - self.scrollX) / self.colWidth)
    },

    /**
     * #method
     */
    rowSpecificBpToPx(rowName: string, position: number) {
      const { rowNames, rows } = self
      const index = rowNames.indexOf(rowName)
      const row = rows[index][1]
      const details = self.getRowData(rowName)
      const offset = details.range?.start || 0
      const current = position - offset
      const s = new Set(self.blanks)

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
        if (s.has(k) && k < i + 1) {
          count++
        }
      }

      return i - count
    },

    /**
     * #method
     */
    globalBpToPx(position: number) {
      let count = 0
      const s = new Set(self.blanks)

      for (let k = 0; k < self.rows[0]?.[1].length; k++) {
        if (s.has(k) && k < position + 1) {
          count++
        }
      }

      return position - count
    },

    /**
     * #method
     */
    relativePxToBp(rowName: string, position: number) {
      const { rowNames, rows } = self
      const index = rowNames.indexOf(rowName)
      if (index !== -1) {
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
      }
      return 0
    },

    /**
     * #method
     */
    relativePxToBp2(rowName: string, position: number) {
      const { rowNames, rows } = self
      const index = rowNames.indexOf(rowName)
      if (index !== -1) {
        const row = rows[index][1]

        let k = 0
        let i = 0
        for (; k < position; i++) {
          if (row[i] !== '-') {
            k++
          } else if (k >= position) {
            break
          }
        }
        return i
      }
      return 0
    },
    /**
     * #method
     */
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

  .views(self => ({
    /**
     * #getter
     * total height of track area (px)
     */
    get totalTrackAreaHeight() {
      return sum(self.turnedOnTracks.map(r => r.model.height))
    },
  }))
  .actions(self => ({
    /**
     * #action
     */
    async exportSVG(opts: { theme: Theme }) {
      const html = await renderToSvg(self as MsaViewModel, opts)
      const blob = new Blob([html], { type: 'image/svg+xml' })
      saveAs(blob, 'image.svg')
    },
    /**
     * #action
     * internal, used for drawing to canvas
     */
    incrementRef() {
      self.nref++
    },
    afterCreate() {
      // autorun opens treeFilehandle
      addDisposer(
        self,
        autorun(async () => {
          const { treeFilehandle } = self
          if (treeFilehandle) {
            try {
              self.setTree(await openLocation(treeFilehandle).readFile('utf8'))
            } catch (e) {
              console.error(e)
              self.setError(e)
            }
          }
        }),
      )
      // autorun opens treeMetadataFilehandle
      addDisposer(
        self,
        autorun(async () => {
          const { treeMetadataFilehandle } = self
          if (treeMetadataFilehandle) {
            try {
              self.setTreeMetadata(
                await openLocation(treeMetadataFilehandle).readFile('utf8'),
              )
            } catch (e) {
              console.error(e)
              self.setError(e)
            }
          }
        }),
      )

      // autorun opens msaFilehandle
      addDisposer(
        self,
        autorun(async () => {
          const { msaFilehandle } = self
          if (msaFilehandle) {
            try {
              self.setMSA(await openLocation(msaFilehandle).readFile('utf8'))
            } catch (e) {
              console.error(e)
              self.setError(e)
            }
          }
        }),
      )

      // autorun synchronizes treeWidth with treeAreaWidth
      addDisposer(
        self,
        autorun(async () => {
          if (self.treeWidthMatchesArea) {
            self.setTreeWidth(
              Math.max(50, self.treeAreaWidth - self.labelsWidth - 20),
            )
          }
        }),
      )
    },
  }))
  .postProcessSnapshot(result => {
    const snap = result as Omit<typeof result, symbol>
    const {
      data: { tree, msa, treeMetadata },
      ...rest
    } = snap

    // remove the MSA/tree data from the tree if the filehandle available in
    // which case it can be reloaded on refresh
    return {
      data: {
        // https://andreasimonecosta.dev/posts/the-shortest-way-to-conditionally-insert-properties-into-an-object-literal/
        ...(!result.treeFilehandle && { tree }),
        ...(!result.msaFilehandle && { msa }),
        ...(!result.treeMetadataFilehandle && { treeMetadata }),
      },
      ...rest,
    }
  })

export default model

export type MsaViewStateModel = typeof model
export type MsaViewModel = Instance<MsaViewStateModel>
