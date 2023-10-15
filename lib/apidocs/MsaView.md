---
id: msaview
title: MsaView
---

Note: this document is automatically generated from mobx-state-tree objects in
our source code.

### Source file

[src/model.ts](https://github.com/GMOD/react-msaview/blob/main/lib/src/model.ts)



### MsaView - Properties
#### property: id



```js
// type signature
IOptionalIType<ISimpleType<string>, [undefined]>
// code
id: ElementId
```

#### property: type



```js
// type signature
ISimpleType<"MsaView">
// code
type: types.literal('MsaView')
```

#### property: height



```js
// type signature
IOptionalIType<ISimpleType<number>, [undefined]>
// code
height: types.optional(types.number, 550)
```

#### property: treeAreaWidth



```js
// type signature
IOptionalIType<ISimpleType<number>, [undefined]>
// code
treeAreaWidth: types.optional(types.number, 400)
```

#### property: treeWidth



```js
// type signature
IOptionalIType<ISimpleType<number>, [undefined]>
// code
treeWidth: types.optional(types.number, 300)
```

#### property: rowHeight



```js
// type signature
number
// code
rowHeight: 20
```

#### property: scrollY



```js
// type signature
number
// code
scrollY: 0
```

#### property: scrollX



```js
// type signature
number
// code
scrollX: 0
```

#### property: resizeHandleWidth



```js
// type signature
number
// code
resizeHandleWidth: 5
```

#### property: blockSize



```js
// type signature
number
// code
blockSize: 1000
```

#### property: mouseRow



```js
// type signature
IMaybe<ISimpleType<number>>
// code
mouseRow: types.maybe(types.number)
```

#### property: mouseCol



```js
// type signature
IMaybe<ISimpleType<number>>
// code
mouseCol: types.maybe(types.number)
```

#### property: selectedStructures



```js
// type signature
IArrayType<IModelType<{ id: ISimpleType<string>; structure: IModelType<{ pdb: ISimpleType<string>; startPos: ISimpleType<number>; endPos: ISimpleType<number>; }, {}, _NotCustomized, _NotCustomized>; range: IMaybe<...>; }, {}, _NotCustomized, _NotCustomized>>
// code
selectedStructures: types.array(StructureModel)
```

#### property: labelsAlignRight



```js
// type signature
false
// code
labelsAlignRight: false
```

#### property: colWidth



```js
// type signature
number
// code
colWidth: 16
```

#### property: showBranchLen



```js
// type signature
true
// code
showBranchLen: true
```

#### property: bgColor



```js
// type signature
true
// code
bgColor: true
```

#### property: drawTree



```js
// type signature
true
// code
drawTree: true
```

#### property: drawNodeBubbles



```js
// type signature
true
// code
drawNodeBubbles: true
```

#### property: highResScaleFactor



```js
// type signature
number
// code
highResScaleFactor: 2
```

#### property: colorSchemeName



```js
// type signature
string
// code
colorSchemeName: 'maeditor'
```

#### property: treeFilehandle



```js
// type signature
IMaybe<ISnapshotProcessor<ITypeUnion<ModelCreationType<ExtractCFromProps<{ locationType: ISimpleType<"UriLocation">; uri: ISimpleType<string>; baseUri: IMaybe<ISimpleType<string>>; internetAccountId: IMaybe<...>; internetAccountPreAuthorization: IMaybe<...>; }>> | ModelCreationType<...> | ModelCreationType<...>, { ....
// code
treeFilehandle: types.maybe(FileLocation)
```

#### property: msaFilehandle



```js
// type signature
IMaybe<ISnapshotProcessor<ITypeUnion<ModelCreationType<ExtractCFromProps<{ locationType: ISimpleType<"UriLocation">; uri: ISimpleType<string>; baseUri: IMaybe<ISimpleType<string>>; internetAccountId: IMaybe<...>; internetAccountPreAuthorization: IMaybe<...>; }>> | ModelCreationType<...> | ModelCreationType<...>, { ....
// code
msaFilehandle: types.maybe(FileLocation)
```

#### property: currentAlignment



```js
// type signature
number
// code
currentAlignment: 0
```

#### property: collapsed



```js
// type signature
IArrayType<ISimpleType<string>>
// code
collapsed: types.array(types.string)
```

#### property: showOnly



```js
// type signature
IMaybe<ISimpleType<string>>
// code
showOnly: types.maybe(types.string)
```

#### property: boxTracks



```js
// type signature
IArrayType<IModelType<{ id: ISimpleType<string>; accession: ISimpleType<string>; name: ISimpleType<string>; associatedRowName: ISimpleType<string>; height: IOptionalIType<...>; }, { ...; } & ... 2 more ... & { ...; }, _NotCustomized, _NotCustomized>>
// code
boxTracks: types.array(UniprotTrack)
```

#### property: turnedOffTracks



```js
// type signature
IMapType<ISimpleType<boolean>>
// code
turnedOffTracks: types.map(types.boolean)
```

#### property: annotatedRegions



```js
// type signature
IArrayType<IModelType<{ start: ISimpleType<number>; end: ISimpleType<number>; attributes: IType<Record<string, string[]>, Record<string, string[]>, Record<string, string[]>>; }, {}, _NotCustomized, _NotCustomized>>
// code
annotatedRegions: types.array(
      types.model({
        start: types.number,
        end: types.number,
        attributes: types.frozen<Record<string, string[]>>(),
      }),
    )
```

#### property: data



```js
// type signature
IOptionalIType<IModelType<{ tree: IMaybe<ISimpleType<string>>; msa: IMaybe<ISimpleType<string>>; }, { setTree(tree?: string): void; setMSA(msa?: string): void; }, _NotCustomized, _NotCustomized>, [...]>
// code
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
    )
```


### MsaView - Getters
#### getter: initialized



```js
// type
boolean
```

#### getter: blocksX



```js
// type
number[]
```

#### getter: blocksY



```js
// type
number[]
```

#### getter: blocks2d



```js
// type
number[][]
```

#### getter: done



```js
// type
string
```

#### getter: colorScheme



```js
// type
Record<string, string>
```

#### getter: header



```js
// type
any
```

#### getter: currentAlignmentName



```js
// type
any
```

#### getter: alignmentNames



```js
// type
any
```

#### getter: noTree



```js
// type
boolean
```

#### getter: menuItems



```js
// type
any[]
```

#### getter: MSA



```js
// type
ClustalMSA | StockholmMSA | FastaMSA
```

#### getter: numColumns



```js
// type
number
```

#### getter: tree



```js
// type
NodeWithIds
```

#### getter: rowNames



```js
// type
string[]
```

#### getter: mouseOverRowName



```js
// type
any
```

#### getter: root



```js
// type
HierarchyNode<any>
```

#### getter: structures



```js
// type
Record<string, { pdb: string; startPos: number; endPos: number; }[]>
```

#### getter: inverseStructures



```js
// type
{ [k: string]: any; }
```

#### getter: msaAreaWidth



```js
// type
number
```

#### getter: blanks



```js
// type
any[]
```

#### getter: rows



```js
// type
any
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

#### getter: colStats



```js
// type
Record<string, number>[]
```

#### getter: hierarchy

generates a new tree that is clustered with x,y positions

```js
// type
HierarchyNode<NodeWithIdsAndLength>
```

#### getter: totalHeight



```js
// type
number
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

#### getter: conservation



```js
// type
string[]
```

#### getter: tracks



```js
// type
BasicTrack[]
```

#### getter: turnedOnTracks



```js
// type
any
```


### MsaView - Methods
#### method: getRowData



```js
// type signature
getRowData: (name: string) => { range: { start: number; end: number; }; data: any; }
```

#### method: getMouseOverResidue



```js
// type signature
getMouseOverResidue: (rowName: string) => any
```

#### method: pxToBp

returns coordinate in the current relative coordinate scheme

```js
// type signature
pxToBp: (coord: number) => number
```

#### method: rowSpecificBpToPx



```js
// type signature
rowSpecificBpToPx: (rowName: string, position: number) => number
```

#### method: globalBpToPx



```js
// type signature
globalBpToPx: (position: number) => number
```

#### method: relativePxToBp



```js
// type signature
relativePxToBp: (rowName: string, position: number) => number
```

#### method: getPos



```js
// type signature
getPos: (pos: number) => number
```


### MsaView - Actions
#### action: setDialogComponent



```js
// type signature
setDialogComponent: (dlg: any, props: any) => void
```

#### action: setHeight



```js
// type signature
setHeight: (height: number) => void
```

#### action: addStructureToSelection



```js
// type signature
addStructureToSelection: (elt: ModelCreationType<ExtractCFromProps<{ id: ISimpleType<string>; structure: IModelType<{ pdb: ISimpleType<string>; startPos: ISimpleType<number>; endPos: ISimpleType<number>; }, {}, _NotCustomized, _NotCustomized>; range: IMaybe<...>; }>>) => void
```

#### action: removeStructureFromSelection



```js
// type signature
removeStructureFromSelection: (elt: ModelCreationType<ExtractCFromProps<{ id: ISimpleType<string>; structure: IModelType<{ pdb: ISimpleType<string>; startPos: ISimpleType<number>; endPos: ISimpleType<number>; }, {}, _NotCustomized, _NotCustomized>; range: IMaybe<...>; }>>) => void
```

#### action: toggleStructureSelection



```js
// type signature
toggleStructureSelection: (elt: { id: string; structure: { startPos: number; endPos: number; pdb: string; }; }) => void
```

#### action: clearSelectedStructures



```js
// type signature
clearSelectedStructures: () => void
```

#### action: setError



```js
// type signature
setError: (error?: unknown) => void
```

#### action: setMousePos



```js
// type signature
setMousePos: (col?: number, row?: number) => void
```

#### action: setRowHeight



```js
// type signature
setRowHeight: (n: number) => void
```

#### action: setColWidth



```js
// type signature
setColWidth: (n: number) => void
```

#### action: setColorSchemeName



```js
// type signature
setColorSchemeName: (name: string) => void
```

#### action: setScrollY



```js
// type signature
setScrollY: (n: number) => void
```

#### action: setScrollX



```js
// type signature
setScrollX: (n: number) => void
```

#### action: setTreeAreaWidth



```js
// type signature
setTreeAreaWidth: (n: number) => void
```

#### action: setTreeWidth



```js
// type signature
setTreeWidth: (n: number) => void
```

#### action: setCurrentAlignment



```js
// type signature
setCurrentAlignment: (n: number) => void
```

#### action: toggleLabelsAlignRight



```js
// type signature
toggleLabelsAlignRight: () => void
```

#### action: toggleDrawTree



```js
// type signature
toggleDrawTree: () => void
```

#### action: toggleCollapsed



```js
// type signature
toggleCollapsed: (node: string) => void
```

#### action: setShowOnly



```js
// type signature
setShowOnly: (node?: string) => void
```

#### action: toggleBranchLen



```js
// type signature
toggleBranchLen: () => void
```

#### action: toggleBgColor



```js
// type signature
toggleBgColor: () => void
```

#### action: toggleNodeBubbles



```js
// type signature
toggleNodeBubbles: () => void
```

#### action: setData



```js
// type signature
setData: (data: { msa?: string; tree?: string; }) => void
```

#### action: setMSAFilehandle



```js
// type signature
setMSAFilehandle: (msaFilehandle?: FileLocation) => Promise<void>
```

#### action: setTreeFilehandle



```js
// type signature
setTreeFilehandle: (treeFilehandle?: FileLocation) => Promise<void>
```

#### action: setMSA



```js
// type signature
setMSA: (result: string) => void
```

#### action: setTree



```js
// type signature
setTree: (result: string) => void
```

#### action: addUniprotTrack



```js
// type signature
addUniprotTrack: (node: { name: string; accession: string; }) => void
```

#### action: doScrollY



```js
// type signature
doScrollY: (deltaY: number) => void
```

#### action: doScrollX



```js
// type signature
doScrollX: (deltaX: number) => void
```

#### action: setMouseoveredColumn



```js
// type signature
setMouseoveredColumn: (n: number, chain: string, file: string) => void
```

#### action: toggleTrack



```js
// type signature
toggleTrack: (id: string) => void
```

#### action: addAnnotation



```js
// type signature
addAnnotation: (start: number, end: number, attributes: Record<string, string[]>) => void
```

#### action: setOffsets



```js
// type signature
setOffsets: (left: number, right: number) => void
```

#### action: clearAnnotPos



```js
// type signature
clearAnnotPos: () => void
```


