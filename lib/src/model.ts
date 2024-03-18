import React from 'react'
import { autorun } from 'mobx'
import { Instance, cast, types, addDisposer } from 'mobx-state-tree'
import { hierarchy, cluster, HierarchyNode } from 'd3-hierarchy'
import { ascending } from 'd3-array'
import Stockholm from 'stockholm-js'
import { saveAs } from 'file-saver'
import { Theme } from '@mui/material'

// jbrowse
import { FileLocation, ElementId } from '@jbrowse/core/util/types/mst'
import { FileLocation as FileLocationType } from '@jbrowse/core/util/types'
import { openLocation } from '@jbrowse/core/util/io'
import { notEmpty, sum } from '@jbrowse/core/util'

// locals
import {
  clamp,
  collapse,
  generateNodeIds,
  maxLength,
  setBrLength,
  skipBlanks,
  NodeWithIds,
  NodeWithIdsAndLength,
} from './util'

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
import { SelectedStructuresMixin } from './model/SelectedStructuresMixin'
import { TreeF } from './model/treeModel'
import { MSAModelF } from './model/msaModel'

// utils
import { jsonfetch } from './fetchUtils'
import { colord } from 'colord'

export interface RowDetails {
  [key: string]: unknown
  name: string
  range?: { start: number; end: number }
}
interface Accession {
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
export interface Structure {
  pdb: string
  startPos: number
  endPos: number
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
 * - BaseViewModel
 * - DialogQueueSessionMixin
 * - MSAModel
 * - Tree
 */
function x() {} // eslint-disable-line @typescript-eslint/no-unused-vars

function reparseTree(tree: NodeWithIds): NodeWithIds {
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

function stateModelFactory() {
  return types
    .compose(
      DialogQueueSessionMixin(),
      SelectedStructuresMixin(),
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
        featureMode: false,
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
         * high resolution scale factor, helps make canvas look better on hi-dpi
         * screens
         */
        highResScaleFactor: 2,

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
         * array of tree parent nodes that are 'collapsed'
         */
        collapsed: types.array(types.string),

        /**
         * #property
         * array of tree leaf nodes that are 'collapsed'
         */
        collapsed2: types.array(types.string),
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
      }),
    )
    .volatile(() => ({
      width: 800,
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

      annotationTracks: [
        'A8CT47_9VIRU%2F46-492.json',
        'B8Y0L1_9VIRU%2F39-459.json',
        'NS1AB_TASV1%2F1126-1583.json',
        'POL1_BAYMY%2F1647-2074.json',
        'POL1_CPMVS%2F1197-1670.json',
        'POLG_EMCVR%2F1853-2275.json',
        'POLG_FCVUR%2F1272-1715.json',
        'POLG_HAVHM%2F1765-2198.json',
        'POLG_NVN68%2F1309-1746.json',
        'POLG_PVYN%2F2312-2736.json',
        'POLG_PYFV1%2F2281-2756.json',
        'POLG_RHDVF%2F1288-1730.json',
        'POLG_VESVA%2F1386-1832.json',
        'Q38L14_9VIRU%2F30-445.json',
        'Q4FCM7_9VIRU%2F30-445.json',
        'Q6YDQ7_9VIRU%2F46-492.json',
        'Q9DLK1_FMDVP%2F1874-2302.json',
        'R1AB_CVHN5%2F4801-5292.json',
        'RDRP_BPPH6%2F35-607.json',
        'RPOA_SHFV%2F2295-2719.json',
        'W1I6K0_9VIRU%2F30-445.json',
      ],
      /**
       * #volatile
       *
       */
      loadedIntroProAnnotations: undefined as
        | undefined
        | Record<
            string,
            {
              matches: {
                signature: {
                  entry?: {
                    name: string
                    description: string
                    accession: string
                  }
                }
                locations: { start: number; end: number }[]
              }[]
            }
          >,
    }))
    .actions(self => ({
      /**
       * #action
       */
      setWidth(arg: number) {
        self.width = arg
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
      setFeatureMode(arg: boolean) {
        self.featureMode = arg
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
        if (self.collapsed2.includes(node)) {
          self.collapsed2.remove(node)
        } else {
          self.collapsed2.push(node)
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

        if (self.collapsed.length || self.collapsed2.length) {
          ;[...self.collapsed, ...self.collapsed2]
            .map(collapsedId => hier.find(node => node.data.id === collapsedId))
            .filter(notEmpty)
            .map(node => collapse(node))
        }

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
      get totalWidth() {
        return self.numColumns * self.colWidth
      },
    }))

    .views(self => ({
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
      get done() {
        return self.initialized && (self.data.msa || self.data.tree)
      },
      /**
       * #getter
       */
      get maxScrollX() {
        return -self.totalWidth + (self.msaAreaWidth - 100)
      },
    }))
    .actions(self => ({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setLoadedInterProAnnotations(data: any) {
        self.loadedIntroProAnnotations = data
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
       * total height of track area (px)
       */
      get totalTrackAreaHeight() {
        return sum(self.turnedOnTracks.map(r => r.model.height))
      },
      /**
       * #getter
       */
      get interProTerms() {
        const types = new Map<string, Accession>()
        if (self.loadedIntroProAnnotations) {
          for (const str of Object.values(self.loadedIntroProAnnotations)) {
            for (const { signature } of str.matches) {
              const { entry } = signature
              if (entry) {
                const { name, accession, description } = entry
                types.set(accession, { name, accession, description })
              }
            }
          }
        }
        return types
      },
    }))
    .views(self => ({
      get fillPalette() {
        const arr = [...self.interProTerms.keys()]
        let i = 0
        const map = {} as Record<string, string>
        for (const key of arr) {
          const k = Math.min(arr.length - 1, palettes.length - 1)
          map[key] = palettes[k][i]
          i++
        }
        return map
      },
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

      afterCreate() {
        addDisposer(
          self,
          autorun(async () => {
            const res = Object.fromEntries(
              await Promise.all(
                self.annotationTracks.map(async f => {
                  const data = await jsonfetch(
                    `https://jbrowse.org/demos/interproscan/json/${encodeURIComponent(f)}`,
                  )
                  return [
                    decodeURIComponent(f).replace('.json', ''),
                    data.result.results[0],
                  ] as const
                }),
              ),
            )
            self.setLoadedInterProAnnotations(res)
          }),
        )
        // autorun opens treeFilehandle
        addDisposer(
          self,
          autorun(async () => {
            const { treeFilehandle } = self
            if (treeFilehandle) {
              try {
                self.setTree(
                  await openLocation(treeFilehandle).readFile('utf8'),
                )
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
          // https://andreasimonecosta.dev/posts/the-shortest-way-to-conditionally-insert-properties-into-an-object-literal/
          ...(!result.treeFilehandle && { tree }),
          ...(!result.msaFilehandle && { msa }),
          ...(!result.treeMetadataFilehandle && { treeMetadata }),
        },
        ...rest,
      }
    })
}

export default stateModelFactory

export type MsaViewStateModel = ReturnType<typeof stateModelFactory>
export type MsaViewModel = Instance<MsaViewStateModel>
