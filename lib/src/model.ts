import React from 'react'
import type { Buffer } from 'buffer'
import { autorun, trace, transaction } from 'mobx'
import { type Instance, cast, types, addDisposer } from 'mobx-state-tree'
import { hierarchy, cluster, type HierarchyNode } from 'd3-hierarchy'
import { ascending } from 'd3-array'
import Stockholm from 'stockholm-js'
import { saveAs } from 'file-saver'
import type { Theme } from '@mui/material'
import { ungzip } from 'pako'

// jbrowse
import { FileLocation, ElementId } from '@jbrowse/core/util/types/mst'
import type { FileLocation as FileLocationType } from '@jbrowse/core/util/types'
import { openLocation } from '@jbrowse/core/util/io'
import { groupBy, notEmpty, sum } from '@jbrowse/core/util'

export function isGzip(buf: Buffer) {
  return buf[0] === 31 && buf[1] === 139 && buf[2] === 8
}

// locals
import {
  clamp,
  collapse,
  generateNodeIds,
  maxLength,
  setBrLength,
  skipBlanks,
  type NodeWithIds,
  type NodeWithIdsAndLength,
  len,
} from './util'
import { colord } from 'colord'
import { reparseTree } from './reparseTree'
import { blocksX, blocksY } from './calculateBlocks'
import { measureTextCanvas } from './measureTextCanvas'
import palettes from './ggplotPalettes'

// components
import TextTrack from './components/TextTrack'

// parsers
import ClustalMSA from './parsers/ClustalMSA'
import StockholmMSA from './parsers/StockholmMSA'
import FastaMSA from './parsers/FastaMSA'
import parseNewick from './parseNewick'
import colorSchemes from './colorSchemes'

// models
import { DataModelF } from './model/DataModel'
import { DialogQueueSessionMixin } from './model/DialogQueue'
import { TreeF } from './model/treeModel'
import { MSAModelF } from './model/msaModel'
import type { InterProScanResults } from './launchInterProScan'
import { makeOffscreenFillTextCache } from './offscreenFillTextCache'

export interface Accession {
  accession: string
  name: string
  description: string
}
export interface BasicTrackModel {
  id: string
  name: string
  associatedRowName?: string
  height: number
}

export interface TextTrackModel extends BasicTrackModel {
  customColorScheme?: Record<string, string>
  data: string
}

export interface ITextTrack {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ReactComponent: React.FC<any>
  model: TextTrackModel
}

export type BasicTrack = ITextTrack

/**
 * #stateModel MsaView
 * extends
 * - DialogQueueSessionMixin
 * - MSAModel
 * - Tree
 */
function stateModelFactory() {
  return types
    .compose(
      DialogQueueSessionMixin(),
      TreeF(),
      MSAModelF(),
      types.model('MsaView', {
        /**
         * #property
         * id of view, randomly generated if not provided
         */
        id: ElementId,

        /**
         * #property
         */
        showDomains: false,
        /**
         * #property
         */
        contrastLettering: true,

        /**
         * #property
         */
        subFeatureRows: false,

        /**
         * #property
         * hardcoded view type
         */
        type: types.literal('MsaView'),

        /**
         * #property
         */
        drawMsaLetters: true,

        /**
         * #property
         */
        drawTreeText: true,

        /**
         * #property
         * height of the div containing the view, px
         */
        height: types.optional(types.number, 550),

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
         * width of columns, px
         */
        colWidth: 16,

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
         * array of tree parent nodes that are 'collapsed' (all children are
         * hidden)
         */
        collapsed: types.array(types.string),

        /**
         * #property
         * array of tree leaf nodes that are 'collapsed' (just that leaf node
         * is hidden)
         */
        collapsedLeaves: types.array(types.string),
        /**
         * #property
         * focus on particular subtree
         */
        showOnly: types.maybe(types.string),
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
        data: types.optional(DataModelF(), { tree: '', msa: '' }),

        /**
         * #property
         */
        featureFilters: types.map(types.boolean),
      }),
    )
    .volatile(() => ({
      /**
       * #volatile
       */
      headerHeight: 0,
      /**
       * #volatile
       */
      status: undefined as { msg: string; url?: string } | undefined,
      /**
       * #volatile
       * high resolution scale factor, helps make canvas look better on hi-dpi
       * screens
       */
      highResScaleFactor: 1,
      /**
       * #volatile
       */
      loadingMSA: false,
      /**
       * #volatile
       */
      loadingTree: false,
      /**
       * #volatile
       */
      volatileWidth: undefined as number | undefined,
      /**
       * #volatile
       * resize handle width between tree and msa area, px
       */
      resizeHandleWidth: 5,

      /**
       * #volatile
       * size of blocks of content to be drawn, px
       */
      blockSize: 500,

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
       * the currently mouse-click row
       */
      mouseClickRow: undefined as number | undefined,

      /**
       * #volatile
       * the currently mouse-click column
       */
      mouseClickCol: undefined as number | undefined,

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
      marginLeft: 20,

      /**
       * #volatile
       */
      error: undefined as unknown,

      /**
       * #volatile
       */
      annotPos: undefined as { left: number; right: number } | undefined,

      /**
       * #volatile
       *
       */
      interProAnnotations: undefined as
        | undefined
        | Record<string, InterProScanResults>,
    }))
    .actions(self => ({
      /**
       * #action
       */
      setContrastLettering(arg: boolean) {
        self.contrastLettering = arg
      },
      /**
       * #action
       */
      setLoadingMSA(arg: boolean) {
        self.loadingMSA = arg
      },
      /**
       * #action
       */
      setLoadingTree(arg: boolean) {
        self.loadingTree = arg
      },
      /**
       * #action
       */
      setWidth(arg: number) {
        self.volatileWidth = arg
      },
      /**
       * #action
       * set the height of the view in px
       */
      setHeight(height: number) {
        self.height = height
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
       */
      setShowDomains(arg: boolean) {
        self.showDomains = arg
      },

      /**
       * #action
       */
      setSubFeatureRows(arg: boolean) {
        self.subFeatureRows = arg
      },
      /**
       * #action
       * set mouse click position (row, column) in the MSA
       */
      setMouseClickPos(col?: number, row?: number) {
        self.mouseClickCol = col
        self.mouseClickRow = row
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
       * set scroll Y-offset (px)
       */
      setScrollY(n: number) {
        self.scrollY = n
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
      toggleCollapsed2(node: string) {
        if (self.collapsedLeaves.includes(node)) {
          self.collapsedLeaves.remove(node)
        } else {
          self.collapsedLeaves.push(node)
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
      setData(data: { msa?: string; tree?: string }) {
        self.data = cast(data)
      },

      /**
       * #action
       */
      setMSAFilehandle(msaFilehandle?: FileLocationType) {
        self.msaFilehandle = msaFilehandle
      },

      /**
       * #action
       */
      setTreeFilehandle(treeFilehandle?: FileLocationType) {
        self.treeFilehandle = treeFilehandle
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

    .views(self => ({
      /**
       * #getter
       */
      get actuallyShowDomains() {
        return self.showDomains && !!self.interProAnnotations
      },
      /**
       * #getter
       */
      get viewInitialized() {
        return self.volatileWidth !== undefined
      },
      /**
       * #getter
       */
      get width() {
        if (self.volatileWidth === undefined) {
          throw new Error('not initialized')
        }
        return self.volatileWidth
      },
    }))
    .views(self => ({
      /**
       * #method
       * unused here, but can be used by derived classes to add extra items
       */
      extraViewMenuItems() {
        return []
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
        return {
          data: this.MSA?.getRowData(name),
        }
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
        return !!this.tree.noTree
      },
      /**
       * #getter
       */
      get noDomains() {
        return !self.interProAnnotations
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
          }
          if (text.startsWith('>')) {
            return new FastaMSA(text)
          }
          return new ClustalMSA(text)
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
      get tree(): NodeWithIds {
        const ret = self.data.tree
          ? generateNodeIds(parseNewick(self.data.tree))
          : this.MSA?.getTree() || {
              noTree: true,
              branchset: [],
              id: 'empty',
              name: 'empty',
            }
        return reparseTree(ret)
      },

      /**
       * #getter
       */
      get leaves() {
        return this.hierarchy.leaves()
      },
      /**
       * #getter
       */
      get rowNames(): string[] {
        return this.leaves.map(n => n.data.name)
      },
      /**
       * #getter
       */
      get mouseOverRowName() {
        const { mouseRow } = self
        return mouseRow === undefined ? undefined : this.rowNames[mouseRow]
      },

      /**
       * #getter
       */
      get root() {
        let hier = hierarchy(this.tree, d => d.branchset)
          .sum(d => (d.branchset ? 0 : 1))
          .sort((a, b) => ascending(a.data.length || 1, b.data.length || 1))

        if (self.showOnly) {
          const res = hier.find(n => n.data.id === self.showOnly)
          if (res) {
            hier = res
          }
        }

        ;[...self.collapsed, ...self.collapsedLeaves]
          .map(collapsedId => hier.find(node => node.data.id === collapsedId))
          .filter(notEmpty)
          .map(node => collapse(node))

        return hier
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
      get treeAreaWidthMinusMargin() {
        return self.treeAreaWidth - self.marginLeft
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
          this.rows.map(
            (row, index) => [row[0], this.columns2d[index]] as const,
          ),
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
        return Math.min(Math.max(6, self.rowHeight - 8), 18)
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
       */
      get colStatsSums() {
        return Object.fromEntries(
          Object.entries(this.colStats).map(([key, val]) => {
            return [key, sum(Object.values(val))]
          }),
        )
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
    .views(self => ({
      /**
       * #getter
       */
      get offscreenFillTextCache() {
        return makeOffscreenFillTextCache(self.fontSize)
      },
      /**
       * #getter
       */
      get totalWidth() {
        return self.numColumns * self.colWidth
      },
    }))

    .views(self => ({
      /**
       * #getter
       */
      get dataInitialized() {
        return (self.data.msa || self.data.tree) && !self.error
      },
      /**
       * #getter
       */
      get blocksX() {
        return blocksX({
          viewportWidth: self.msaAreaWidth,
          viewportX: -self.scrollX,
          blockSize: self.blockSize,
          mapWidth: self.totalWidth,
        })
      },
      /**
       * #getter
       */
      get blocksY() {
        return blocksY({
          viewportHeight: self.height,
          viewportY: -self.scrollY,
          blockSize: self.blockSize,
          mapHeight: self.totalHeight,
        })
      },
    }))
    .views(self => ({
      /**
       * #getter
       */
      get blocks2d() {
        const ret = []
        for (const by of self.blocksY) {
          for (const bx of self.blocksX) {
            ret.push([bx, by])
          }
        }
        return ret
      },

      /**
       * #getter
       */
      get isLoading() {
        return self.loadingMSA || self.loadingTree
      },
      /**
       * #getter
       */
      get maxScrollX() {
        return -self.totalWidth + (self.msaAreaWidth - 100)
      },
      /**
       * #getter
       */
      get showMsaLetters() {
        return self.drawMsaLetters && self.rowHeight >= 6 && self.colWidth >= 5
      },
      /**
       * #getter
       */
      get showTreeText() {
        return self.drawLabels && self.rowHeight >= 6
      },
    }))
    .actions(self => ({
      /**
       * #action
       */
      setDrawMsaLetters(arg: boolean) {
        self.drawMsaLetters = arg
      },

      /**
       * #action
       */
      zoomOutHorizontal() {
        self.colWidth = Math.max(1, Math.floor(self.colWidth * 0.75))
        self.scrollX = clamp(self.maxScrollX, self.scrollX, 0)
      },
      /**
       * #action
       */
      zoomInHorizontal() {
        self.colWidth = Math.ceil(self.colWidth * 1.5)
        self.scrollX = clamp(self.maxScrollX, self.scrollX, 0)
      },
      /**
       * #action
       */
      zoomInVertical() {
        self.rowHeight = Math.ceil(self.rowHeight * 1.5)
      },
      /**
       * #action
       */
      zoomOutVertical() {
        self.rowHeight = Math.max(1.5, Math.floor(self.rowHeight * 0.75))
      },
      /**
       * #action
       */
      zoomIn() {
        transaction(() => {
          self.colWidth = Math.ceil(self.colWidth * 1.5)
          self.rowHeight = Math.ceil(self.rowHeight * 1.5)
          self.scrollX = clamp(self.maxScrollX, self.scrollX, 0)
        })
      },
      /**
       * #action
       */
      zoomOut() {
        transaction(() => {
          self.colWidth = Math.max(1, Math.floor(self.colWidth * 0.75))
          self.rowHeight = Math.max(1.5, Math.floor(self.rowHeight * 0.75))
          self.scrollX = clamp(self.maxScrollX, self.scrollX, 0)
        })
      },
      /**
       * #action
       */
      setInterProAnnotations(data: Record<string, InterProScanResults>) {
        self.interProAnnotations = data
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
        self.scrollX = clamp(self.maxScrollX, self.scrollX + deltaX, 0)
      },

      /**
       * #action
       */
      setScrollX(n: number) {
        self.scrollX = clamp(self.maxScrollX, n, 0)
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
      /**
       * #action
       */
      setStatus(status?: { msg: string; url?: string }) {
        self.status = status
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
              measureTextCanvas(
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
      get tracks(): BasicTrack[] {
        return this.adapterTrackModels
      },

      /**
       * #getter
       */
      get turnedOnTracks() {
        return this.tracks.filter(f => !self.turnedOffTracks.has(f.model.id))
      },

      /**
       * #getter
       */
      get showHorizontalScrollbar() {
        return self.msaAreaWidth < self.totalWidth
      },

      /**
       * #method
       * return a row-specific sequence coordinate, skipping gaps, given a global
       * coordinate
       */
      globalCoordToRowSpecificSeqCoord(rowName: string, position: number) {
        const { rowNames, rows } = self
        const index = rowNames.indexOf(rowName)
        if (index !== -1 && rows[index]) {
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
       * return a global coordinate given a row-specific sequence coordinate
       * which does not not include gaps
       */
      seqCoordToRowSpecificGlobalCoord(rowName: string, position: number) {
        const { rowNames, rows } = self
        const index = rowNames.indexOf(rowName)
        if (index !== -1 && rows[index]) {
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
    }))

    .views(self => ({
      /**
       * #getter
       * widget width minus the tree area gives the space for the MSA
       */
      get msaAreaHeight() {
        return (
          self.height -
          (self.showHorizontalScrollbar ? self.minimapHeight : 0) -
          self.headerHeight
        )
      },
      /**
       * #getter
       * total height of track area (px)
       */
      get totalTrackAreaHeight() {
        return sum(self.turnedOnTracks.map(r => r.model.height))
      },
      /**
       * #getter
       */
      get tidyTypes() {
        const types = new Map<string, Accession>()
        if (this.tidyAnnotations) {
          for (const { name, accession, description } of this.tidyAnnotations) {
            types.set(accession, { name, accession, description })
          }
        }
        return types
      },
      /**
       * #getter
       */
      get tidyAnnotations() {
        const ret = []
        const { interProAnnotations } = self
        if (interProAnnotations) {
          for (const [id, val] of Object.entries(interProAnnotations)) {
            for (const { signature, locations } of val.matches) {
              const { entry } = signature
              if (entry) {
                const { name, accession, description } = entry
                for (const { start, end } of locations) {
                  ret.push({
                    id,
                    name,
                    accession,
                    description,
                    start,
                    end,
                  })
                }
              }
            }
          }
        }
        return ret.sort((a, b) => len(b) - len(a))
      },
      /**
       * #getter
       */
      get tidyFilteredAnnotations() {
        return this.tidyAnnotations.filter(r =>
          self.featureFilters.get(r.accession),
        )
      },
      /**
       * #getter
       */
      get tidyFilteredGatheredAnnotations() {
        return groupBy(this.tidyFilteredAnnotations, r => r.id)
      },
    }))
    .views(self => ({
      /**
       * #getter
       */
      get showVerticalScrollbar() {
        return self.msaAreaHeight < self.totalHeight
      },
    }))
    .views(self => ({
      /**
       * #getter
       */
      get verticalScrollbarWidth() {
        return self.showVerticalScrollbar ? 20 : 0
      },
      /**
       * #getter
       */
      get fillPalette() {
        const arr = [...self.tidyTypes.keys()]
        let i = 0
        const map = {} as Record<string, string>
        for (const key of arr) {
          const k = Math.min(arr.length - 1, palettes.length - 1)
          map[key] = palettes[k][i]
          i++
        }
        return map
      },
      /**
       * #getter
       */
      get strokePalette() {
        return Object.fromEntries(
          Object.entries(this.fillPalette).map(([key, val]) => [
            key,
            colord(val).darken(0.1).toHex(),
          ]),
        )
      },
    }))
    .actions(self => ({
      /**
       * #action
       */
      setHeaderHeight(arg: number) {
        self.headerHeight = arg
      },
      /**
       * #action
       */
      reset() {
        self.setData({ tree: '', msa: '' })
        self.setError(undefined)
        self.setScrollY(0)
        self.setScrollX(0)
        self.setCurrentAlignment(0)
        self.setTreeFilehandle(undefined)
        self.setMSAFilehandle(undefined)
      },
      /**
       * #action
       */
      async exportSVG(opts: {
        theme: Theme
        includeMinimap?: boolean
        exportType: string
      }) {
        const { renderToSvg } = await import('./renderToSvg')
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

      /**
       * #action
       */
      initFilter(arg: string) {
        const ret = self.featureFilters.get(arg)
        if (ret === undefined) {
          self.featureFilters.set(arg, true)
        }
      },
      /**
       * #action
       */
      setFilter(arg: string, flag: boolean) {
        self.featureFilters.set(arg, flag)
      },

      afterCreate() {
        addDisposer(
          self,
          autorun(() => {
            for (const key of self.tidyTypes.keys()) {
              this.initFilter(key)
            }
          }),
        )

        // autorun opens treeFilehandle
        addDisposer(
          self,
          autorun(async () => {
            const { treeFilehandle } = self
            if (treeFilehandle) {
              try {
                self.setLoadingTree(true)
                self.setTree(
                  await openLocation(treeFilehandle).readFile('utf8'),
                )
                if (treeFilehandle.locationType === 'BlobLocation') {
                  // clear filehandle after loading if from a local file
                  self.setTreeFilehandle(undefined)
                }
              } catch (e) {
                console.error(e)
                self.setError(e)
              } finally {
                self.setLoadingTree(false)
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
                self.setLoadingMSA(true)
                const res = await openLocation(msaFilehandle).readFile()
                const buf = isGzip(res) ? ungzip(res) : res
                const txt = new TextDecoder('utf8').decode(buf)
                transaction(() => {
                  self.setMSA(txt)
                  if (msaFilehandle.locationType === 'BlobLocation') {
                    // clear filehandle after loading if from a local file
                    self.setMSAFilehandle(undefined)
                  }
                })
              } catch (e) {
                console.error(e)
                self.setError(e)
              } finally {
                self.setLoadingMSA(false)
              }
            }
          }),
        )
        addDisposer(
          self,
          autorun(() => {
            // force colStats not to go stale,
            // xref solution https://github.com/mobxjs/mobx/issues/266#issuecomment-222007278
            // xref problem https://github.com/GMOD/react-msaview/issues/75
            self.colStats
            self.colStatsSums
            self.offscreenFillTextCache
            self.columns
          }),
        )

        // autorun synchronizes treeWidth with treeAreaWidth
        addDisposer(
          self,
          autorun(async () => {
            if (self.treeWidthMatchesArea) {
              self.setTreeWidth(
                Math.max(
                  50,
                  self.treeAreaWidth - self.labelsWidth - 10 - self.marginLeft,
                ),
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
          ...(result.treeFilehandle ? {} : { tree }),
          ...(result.msaFilehandle ? {} : { msa }),
          ...(result.treeMetadataFilehandle ? {} : { treeMetadata }),
        },
        ...rest,
      }
    })
}

export default stateModelFactory

export type MsaViewStateModel = ReturnType<typeof stateModelFactory>
export type MsaViewModel = Instance<MsaViewStateModel>
