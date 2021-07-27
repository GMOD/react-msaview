# CHANGELOG

## v1.2.2

- Improve the clickmap for tree nodes
- Create template for adding annotation tracks, including feature-style glyphs from genome browsers
- Fix colormap for secondary structure tracks from stockholm files
- Add ability to download tracks from uniprot

## v1.2.1

- Fix blocks not displaying properly in the v1.2.0 release

## v1.2.0

- Add ability to integrate with a 3D viewer based on "selecting" a structure
- Add easy ability to copy a node name from the tree to the clipboard
- Add demo integration with the NGL (https://nglviewer.github.io/) library in the app folder
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

- Use postversion to run build so that the accurate version is encoded into the release binary

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
- The collapse subtree action hides gaps that were introduced by that subtree
  in the rest of the alignment
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
