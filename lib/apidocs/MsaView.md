---
id: msaview
title: MsaView
---

Note: this document is automatically generated from mobx-state-tree objects in
our source code.

### Source file

[src/model.ts](https://github.com/GMOD/react-msaview/blob/main/lib/src/model.ts)

extends
- BaseViewModel
- DialogQueueSessionMixin

### MsaView - Properties
#### property: bgColor

draw MSA tiles with a background color

```js
// type signature
true
// code
bgColor: true
```

#### property: boxTracks

a list of "tracks" to display, as box-like glyphs (e.g. protein
domains)

```js
// type signature
IArrayType<IModelType<{ id: ISimpleType<string>; accession: ISimpleType<string>; name: ISimpleType<string>; associatedRowName: ISimpleType<string>; height: IOptionalIType<...>; }, { ...; } & ... 2 more ... & { ...; }, _NotCustomized, _NotCustomized>>
// code
boxTracks: types.array(UniprotTrack)
```

#### property: collapsed

array of tree nodes that are 'collapsed'

```js
// type signature
IArrayType<ISimpleType<string>>
// code
collapsed: types.array(types.string)
```

#### property: colorSchemeName

default color scheme name

```js
// type signature
string
// code
colorSchemeName: 'maeditor'
```

#### property: colWidth

width of columns, px

```js
// type signature
number
// code
colWidth: 16
```

#### property: currentAlignment



```js
// type signature
number
// code
currentAlignment: 0
```

#### property: data

data from the loaded tree/msa/treeMetadata, generally loaded by
autorun

```js
// type signature
IOptionalIType<IModelType<{ tree: IMaybe<ISimpleType<string>>; msa: IMaybe<ISimpleType<string>>; treeMetadata: IMaybe<ISimpleType<string>>; }, { ...; }, _NotCustomized, _NotCustomized>, [...]>
// code
data: types.optional(DataModelF(), { tree: '', msa: '' })
```

#### property: drawNodeBubbles

draw clickable node bubbles on the tree

```js
// type signature
true
// code
drawNodeBubbles: true
```

#### property: drawTree

draw tree, boolean

```js
// type signature
true
// code
drawTree: true
```

#### property: height

height of the div containing the view, px

```js
// type signature
IOptionalIType<ISimpleType<number>, [undefined]>
// code
height: types.optional(types.number, 550)
```

#### property: hidden

array of leaf nodes that are 'hidden', similar to collapsed but for leaf nodes

```js
// type signature
IArrayType<ISimpleType<string>>
// code
hidden: types.array(types.string)
```

#### property: highResScaleFactor

high resolution scale factor, helps make canvas look better on hi-dpi
screens

```js
// type signature
number
// code
highResScaleFactor: 2
```

#### property: id

id of view, randomly generated if not provided

```js
// type signature
IOptionalIType<ISimpleType<string>, [undefined]>
// code
id: ElementId
```

#### property: labelsAlignRight

right-align the labels

```js
// type signature
false
// code
labelsAlignRight: false
```

#### property: msaFilehandle

filehandle object for the MSA (which could contain a tree e.g. with
stockholm files)

```js
// type signature
IMaybe<ISnapshotProcessor<ITypeUnion<ModelCreationType<ExtractCFromProps<{ locationType: ISimpleType<"UriLocation">; uri: ISimpleType<string>; baseUri: IMaybe<ISimpleType<string>>; internetAccountId: IMaybe<...>; internetAccountPreAuthorization: IMaybe<...>; }>> | ModelCreationType<...> | ModelCreationType<...>, { ....
// code
msaFilehandle: types.maybe(FileLocation)
```

#### property: rowHeight

height of each row, px

```js
// type signature
number
// code
rowHeight: 20
```

#### property: scrollX

scroll position, X-offset, px

```js
// type signature
number
// code
scrollX: 0
```

#### property: scrollY

scroll position, Y-offset, px

```js
// type signature
number
// code
scrollY: 0
```

#### property: selectedStructures

currently "selected" structures, generally PDB 3-D protein structures

```js
// type signature
IArrayType<IModelType<{ id: ISimpleType<string>; structure: IModelType<{ pdb: ISimpleType<string>; startPos: ISimpleType<number>; endPos: ISimpleType<number>; }, {}, _NotCustomized, _NotCustomized>; range: IMaybe<...>; }, {}, _NotCustomized, _NotCustomized>>
// code
selectedStructures: types.array(StructureModel)
```

#### property: showBranchLen

use "branch length" e.g. evolutionary distance to draw tree branch
lengths. if false, the layout is a "cladogram" that does not take into
account evolutionary distances

```js
// type signature
true
// code
showBranchLen: true
```

#### property: showOnly

focus on particular subtree

```js
// type signature
IMaybe<ISimpleType<string>>
// code
showOnly: types.maybe(types.string)
```

#### property: treeAreaWidth

width of the area the tree is drawn in, px

```js
// type signature
IOptionalIType<ISimpleType<number>, [undefined]>
// code
treeAreaWidth: types.optional(types.number, 400)
```

#### property: treeFilehandle

filehandle object for the tree

```js
// type signature
IMaybe<ISnapshotProcessor<ITypeUnion<ModelCreationType<ExtractCFromProps<{ locationType: ISimpleType<"UriLocation">; uri: ISimpleType<string>; baseUri: IMaybe<ISimpleType<string>>; internetAccountId: IMaybe<...>; internetAccountPreAuthorization: IMaybe<...>; }>> | ModelCreationType<...> | ModelCreationType<...>, { ....
// code
treeFilehandle: types.maybe(FileLocation)
```

#### property: treeMetadataFilehandle

filehandle object for tree metadata

```js
// type signature
IMaybe<ISnapshotProcessor<ITypeUnion<ModelCreationType<ExtractCFromProps<{ locationType: ISimpleType<"UriLocation">; uri: ISimpleType<string>; baseUri: IMaybe<ISimpleType<string>>; internetAccountId: IMaybe<...>; internetAccountPreAuthorization: IMaybe<...>; }>> | ModelCreationType<...> | ModelCreationType<...>, { ....
// code
treeMetadataFilehandle: types.maybe(FileLocation)
```

#### property: treeWidth

width of the tree within the treeArea, px

```js
// type signature
IOptionalIType<ISimpleType<number>, [undefined]>
// code
treeWidth: types.optional(types.number, 300)
```

#### property: turnedOffTracks

turned off tracks

```js
// type signature
IMapType<ISimpleType<boolean>>
// code
turnedOffTracks: types.map(types.boolean)
```

#### property: type

hardcoded view type

```js
// type signature
ISimpleType<"MsaView">
// code
type: types.literal('MsaView')
```


### MsaView - Getters
#### getter: _tree



```js
// type
NodeWithIds
```

#### getter: adapterTrackModels



```js
// type
BasicTrack[]
```

#### getter: alignmentNames



```js
// type
any
```

#### getter: blanks



```js
// type
any[]
```

#### getter: blocks2d



```js
// type
any[]
```

#### getter: blocksX



```js
// type
any[]
```

#### getter: blocksY



```js
// type
any[]
```

#### getter: boxTrackModels



```js
// type
BasicTrack[]
```

#### getter: colorScheme



```js
// type
Record<string, string>
```

#### getter: colStats



```js
// type
Record<string, number>[]
```

#### getter: columns



```js
// type
{ [k: string]: any; }
```

#### getter: columns2d



```js
// type
any
```

#### getter: conservation



```js
// type
string[]
```

#### getter: currentAlignmentName



```js
// type
any
```

#### getter: done



```js
// type
string
```

#### getter: fontSize



```js
// type
number
```

#### getter: header



```js
// type
any
```

#### getter: hierarchy

generates a new tree that is clustered with x,y positions

```js
// type
HierarchyNode<NodeWithIdsAndLength>
```

#### getter: initialized



```js
// type
boolean
```

#### getter: inverseStructures



```js
// type
{ [k: string]: any; }
```

#### getter: labelsWidth



```js
// type
number
```

#### getter: maxScrollX



```js
// type
number
```

#### getter: menuItems



```js
// type
any[]
```

#### getter: mouseOverRowName



```js
// type
any
```

#### getter: MSA



```js
// type
ClustalMSA | StockholmMSA | FastaMSA
```

#### getter: msaAreaWidth

widget width minus the tree area gives the space for the MSA

```js
// type
number
```

#### getter: noTree



```js
// type
boolean
```

#### getter: numColumns



```js
// type
number
```

#### getter: root



```js
// type
HierarchyNode<any>
```

#### getter: rowNames



```js
// type
string[]
```

#### getter: rows



```js
// type
any
```

#### getter: secondaryStructureConsensus



```js
// type
any
```

#### getter: seqConsensus



```js
// type
any
```

#### getter: structures



```js
// type
Record<string, Structure[]>
```

#### getter: totalHeight



```js
// type
number
```

#### getter: totalTrackAreaHeight

total height of track area (px)

```js
// type
number
```

#### getter: totalWidth



```js
// type
number
```

#### getter: tracks



```js
// type
BasicTrack[]
```

#### getter: treeAreaWidthMinusMargin



```js
// type
number
```

#### getter: treeMetadata



```js
// type
any
```

#### getter: treeWidthMatchesArea

synchronization that matches treeWidth to treeAreaWidth

```js
// type
true
```

#### getter: turnedOnTracks



```js
// type
any
```


### MsaView - Methods
#### method: getMouseOverResidue



```js
// type signature
getMouseOverResidue: (rowName: string) => any
```

#### method: getPos



```js
// type signature
getPos: (pos: number) => number
```

#### method: getRowData



```js
// type signature
getRowData: (name: string) => { range: { start: number; end: number; }; data: any; }
```

#### method: globalBpToPx



```js
// type signature
globalBpToPx: (position: number) => number
```

#### method: pxToBp

returns coordinate in the current relative coordinate scheme

```js
// type signature
pxToBp: (coord: number) => number
```

#### method: globalCoordToRowSpecificCoord



```js
// type signature
globalCoordToRowSpecificCoord: (rowName: string, position: number) => number
```

#### method: globalCoordToRowSpecificCoord2



```js
// type signature
globalCoordToRowSpecificCoord2: (rowName: string, position: number) => number
```

#### method: rowSpecificBpToPx



```js
// type signature
rowSpecificBpToPx: (rowName: string, position: number) => number
```


### MsaView - Actions
#### action: addStructureToSelection

add to the selected structures

```js
// type signature
addStructureToSelection: (elt: ModelCreationType<ExtractCFromProps<{ id: ISimpleType<string>; structure: IModelType<{ pdb: ISimpleType<string>; startPos: ISimpleType<number>; endPos: ISimpleType<number>; }, {}, _NotCustomized, _NotCustomized>; range: IMaybe<...>; }>>) => void
```

#### action: addUniprotTrack



```js
// type signature
addUniprotTrack: (node: { name: string; accession: string; }) => void
```

#### action: clearHidden



```js
// type signature
clearHidden: () => void
```

#### action: clearSelectedStructures

clear all selected structures

```js
// type signature
clearSelectedStructures: () => void
```

#### action: doScrollX



```js
// type signature
doScrollX: (deltaX: number) => void
```

#### action: doScrollY



```js
// type signature
doScrollY: (deltaY: number) => void
```

#### action: exportSVG



```js
// type signature
exportSVG: (opts: { theme: Theme; includeMinimap?: boolean; exportType: string; }) => Promise<void>
```

#### action: hideNode



```js
// type signature
hideNode: (arg: string) => void
```

#### action: incrementRef

internal, used for drawing to canvas

```js
// type signature
incrementRef: () => void
```

#### action: removeStructureFromSelection

remove from the selected structures

```js
// type signature
removeStructureFromSelection: (elt: ModelCreationType<ExtractCFromProps<{ id: ISimpleType<string>; structure: IModelType<{ pdb: ISimpleType<string>; startPos: ISimpleType<number>; endPos: ISimpleType<number>; }, {}, _NotCustomized, _NotCustomized>; range: IMaybe<...>; }>>) => void
```

#### action: setBgColor



```js
// type signature
setBgColor: (arg: boolean) => void
```

#### action: setColorSchemeName

set color scheme name

```js
// type signature
setColorSchemeName: (name: string) => void
```

#### action: setColWidth

set col width (px)

```js
// type signature
setColWidth: (n: number) => void
```

#### action: setCurrentAlignment



```js
// type signature
setCurrentAlignment: (n: number) => void
```

#### action: setData



```js
// type signature
setData: (data: { msa?: string; tree?: string; }) => void
```

#### action: setDrawNodeBubbles



```js
// type signature
setDrawNodeBubbles: (arg: boolean) => void
```

#### action: setDrawTree



```js
// type signature
setDrawTree: (arg: boolean) => void
```

#### action: setError

set error state

```js
// type signature
setError: (error?: unknown) => void
```

#### action: setHeight

set the height of the view in px

```js
// type signature
setHeight: (height: number) => void
```

#### action: setLabelsAlignRight



```js
// type signature
setLabelsAlignRight: (arg: boolean) => void
```

#### action: setMouseoveredColumn



```js
// type signature
setMouseoveredColumn: (n: number, chain: string, file: string) => void
```

#### action: setMousePos

set mouse position (row, column) in the MSA

```js
// type signature
setMousePos: (col?: number, row?: number) => void
```

#### action: setMSA



```js
// type signature
setMSA: (result: string) => void
```

#### action: setMSAFilehandle



```js
// type signature
setMSAFilehandle: (msaFilehandle?: FileLocation) => Promise<void>
```

#### action: setRowHeight

set row height (px)

```js
// type signature
setRowHeight: (n: number) => void
```

#### action: setScrollX



```js
// type signature
setScrollX: (n: number) => void
```

#### action: setScrollY

set scroll Y-offset (px)

```js
// type signature
setScrollY: (n: number) => void
```

#### action: setShowBranchLen



```js
// type signature
setShowBranchLen: (arg: boolean) => void
```

#### action: setShowOnly



```js
// type signature
setShowOnly: (node?: string) => void
```

#### action: setTree



```js
// type signature
setTree: (result: string) => void
```

#### action: setTreeAreaWidth

set tree area width (px)

```js
// type signature
setTreeAreaWidth: (n: number) => void
```

#### action: setTreeFilehandle



```js
// type signature
setTreeFilehandle: (treeFilehandle?: FileLocation) => Promise<void>
```

#### action: setTreeMetadata



```js
// type signature
setTreeMetadata: (result: string) => void
```

#### action: setTreeWidth

set tree width (px)

```js
// type signature
setTreeWidth: (n: number) => void
```

#### action: setTreeWidthMatchesArea

synchronize the treewidth and treeareawidth

```js
// type signature
setTreeWidthMatchesArea: (arg: boolean) => void
```

#### action: toggleCollapsed



```js
// type signature
toggleCollapsed: (node: string) => void
```

#### action: toggleStructureSelection

toggle a structure from the selected structures list

```js
// type signature
toggleStructureSelection: (elt: { id: string; structure: { startPos: number; endPos: number; pdb: string; }; }) => void
```

#### action: toggleTrack



```js
// type signature
toggleTrack: (id: string) => void
```


