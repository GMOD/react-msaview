# CHANGELOG

## v3.1.1

- Add minimap to Export SVG header
- Improve block calculations

## v3.1.0

- Add Export SVG function

## v3.0.3

- Fix tree drawing

## v3.0.2

- Bump clustal-js

## v3.0.1

- New settings dialog layout

## v3.0.0

- Removed coordinate system from the header bar, instead uses a slider bar to
  indicate coordinates

## v2.1.4

- Remove type:module as it caused issues in esbuild

## v2.1.3

- Add concept of treeMetadata, for mapping species names to display labels

## v2.1.2

- Add auto-generated API docs
- Convert to postProcessSnapshot, as snapshotProcessor was producing typescript
  errors

## v2.1.1

- Convert to colord for smaller bundle

## v2.1.0

- Use proper typescript types from ngl (currently had a ts-nocheck on
  ProteinPanel)
- Fix crash when changing MSA models with a protein panel still open in the app
- Add zoom in and out buttons
- Add horizontal mouse over
- Fix uniprot track by stripping version number

## v2.0.0

Bump deps to e.g. MUIv5

## v1.3.2

- Fix error clicking msa sources that don't define getRowDetails

## v1.3.1

- Avoid a console.error undefined

## v1.3.0

- Add ability to use a UMD bundle

## v1.2.11

- Make links use event.preventDefault()

## v1.2.10

- Remove dependency on @gmod/gff to avoid need to polyfill nodejs streams

## v1.2.9

- Use react instead of react-jsx transform

## v1.2.8

- Remove obsolete module field from react-msaview

## v1.2.7

- Add bugfix for data while loading

## v1.2.6

- Fix collapsing of annotations
- Fix mouseover of protein panel highlighting the right bases in MSA panel
- Add clustalX dynamic coloring scheme
- Add percent identity dynamic coloring scheme

## v1.2.5

- Make the mouseover cross annotation tracks
- Allow click and drag on ruler to create basic annotations

## v1.2.4

- Fix inability to close tracks due to some confusion about model IDs

## v1.2.3

- Add "Get info" about tracks
- Fix coordinate shifting on collapsed nodes with box tracks using bpToPx

## v1.2.2

- Improve the clickmap for tree nodes
- Create template for adding annotation tracks, including feature-style glyphs
  from genome browsers
- Fix colormap for secondary structure tracks from stockholm files
- Add ability to download tracks from uniprot

## v1.2.1

- Fix blocks not displaying properly in the v1.2.0 release

## v1.2.0

- Add ability to integrate with a 3D viewer based on "selecting" a structure
- Add easy ability to copy a node name from the tree to the clipboard
- Add demo integration with the NGL (https://nglviewer.github.io/) library in
  the app folder
- Add click and drag scrolling behavior

## v1.1.2

- Fix scrolling of area width

## v1.1.1

- Add drag handle
- Add basic ruler

## v1.1.0

- Botched release process, please ignore

## v1.0.15

- Remove some console logs

## v1.0.14

- Rename to react-msaview, split out from jbrowse plugin

## v1.0.13

- Fix nodes with the same score being collapsed together (#21)

## v1.0.12

- Avoid scrolling too far right

## v1.0.11

- Add version number from package.json to about panel

## v1.0.10

- Fix scrolling for large MSA that loads after tree

## v1.0.9

- Fix for MSA loading bar when tree only is displayed

## v1.0.8

- Fix for side scrolling half rendered letters in MSA
- drawNodeBubbles option

## v1.0.7

- Move npm run build script to prepare script in package.jsom

## v1.0.6

- Use postversion to run build so that the accurate version is encoded into the
  release binary

## v1.0.5

- Add prebuild clean

## v1.0.4

- Fix running build before release

## v1.0.3

- Re-release

## v1.0.2

- Ensure clean build with prebuild rm -rf dist

## v1.0.1

- Fix for making demo config on unpkg

## v1.0.0

### Features

- Vertical virtualized scrolling of phylogenetic tree
- Vertical and horizontal virtualized scrolling of multiple sequence alignment
  as a newick tree embedded in stockholm metadata
- View metadata about alignment from MSA headers (e.g. stockholm)
- Collapse subtrees with click action on branches
- The collapse subtree action hides gaps that were introduced by that subtree in
  the rest of the alignment
- Allows "zooming out" by setting tiny rowHeight/colWidth settings
- Allows changing color schemes, with jalview, clustal, and other color schemes
- Allows toggling the branch length rendering for the phylogenetic tree
- Can share sessions with other users which will send relevant settings and
  links to files to automatically open your results
- The tree or the MSA panel can be loaded separately from each other

### File format supports

- FASTA formatted for MSA (e.g. gaps already inserted)
- Stockholm files (e.g. .stock file, with or without embedded newick tree, uses
  stockholm-js parser. also supports "multi-stockholm" files with multiple
  alignments embedded in a single file)
- Clustal files (e.g. .aln file, uses clustal-js parser)
- Newick (tree can be loaded separately as a .nh file)
