# An RSV phylogeny from a public Nextstrain build

A phylogenetic tree with a dozen tips fits on a screen with room to read every
label. A public health lab tracking a virus works with a tree two orders of
magnitude bigger: one tip per genome sequenced that season, thousands of them,
related by descent within one species. This page takes one such tree, a public
Nextstrain build of respiratory syncytial virus, reconstructs an alignment and
tree from it that an alignment viewer can open, and shows how collapsing,
subsampling and zooming make 1,840 rows readable. It then writes the clade,
country, region and year Nextstrain records for each genome as a row table, and
colors the tip labels, the tree edges and the rows from it, which is ggtree's
`groupClade`, `aes(color = group)` and `geom_hilight` done as data the viewer
draws.

## Prerequisites

- Python 3, standard library only

## Where the data comes from

Nextstrain's RSV-A build, updated 2024-07-16: a tree over 1,840 genomes, one
ancestral sequence, the nucleotide substitutions on every branch between them,
and the metadata of every tip. The build script fetches it, so there is nothing
to download by hand.

- the auspice JSON itself: https://data.nextstrain.org/rsv_a_genome.json
- the subsampled whole-genome alignment the later figures use:
  https://gmod.org/JBrowseMSA/demo/data/scale/rsv-sample.aln
- its tree: https://gmod.org/JBrowseMSA/demo/data/scale/rsv-sample.nh
- the subsample's row table:
  https://gmod.org/JBrowseMSA/demo/data/scale/rsv-sample-rowdata.json

<details>
<summary>The files this page writes, hosted for the figure links</summary>

- the full-tip alignment the build script reconstructs from the JSON, sliced to
  the _G_ gene: https://gmod.org/JBrowseMSA/demo/data/scale/rsv-full.aln
- its tree: https://gmod.org/JBrowseMSA/demo/data/scale/rsv-full.nh

</details>

## The genome

RSV-A's genome is 15,225 nucleotides, eleven genes from _NS1_ to _L_. Two of
them anchor this page. _G_, the attachment glycoprotein, carries the ectodomain
that takes the brunt of antibody selection. _L_, the polymerase, replicates the
genome and tolerates change in almost none of its residues. Nextstrain's
pipeline places every sampled genome in a tree but publishes no alignment of
them, so the first step builds one.

## 1. Reconstruct the alignment from the tree

Every branch in the JSON carries the nucleotide substitutions that happened on
it, numbered against one embedded reference sequence. Copying that reference
down each root-to-tip path, overwriting one base per mutation as you go,
produces every tip's full genome in the same 15,225 coordinates the reference
uses:

```python
def reconstruct(node, seq):
    muts = node.get("branch_attrs", {}).get("mutations", {}).get("nuc", [])
    if muts:
        seq = bytearray(seq)
        for m in muts:
            _ref, pos, alt = MUT_RE.match(m).groups()
            seq[int(pos) - 1] = ord(alt)
        seq = bytes(seq)
    na = node.get("node_attrs", {})
    if not node.get("children"):
        tips.append((label_for(na, node["name"]), seq, na))
    else:
        for child in node["children"]:
            reconstruct(child, seq)
```

```bash
python3 build_phylogeny_at_scale.py .
```

```
reconstructed 1840 tip sequences, genome length 15225
G gene 4652-5617 (966 nt)
L gene 8532-15029 (6498 nt)
```

The rows come out already aligned: a substitution changes a base without moving
anything around it, and this dataset carries no insertion relative to the
reference. A deletion becomes a run of gap characters at a fixed position, which
fits an alignment column. Each row is named `accession|clade|country|year`, four
fields `label_for` reads off the tip's `node_attrs`.

## 2. The whole tree at once

The first view draws all 1,840 tips at one pixel of row height, next to the
alignment sliced to the _G_ gene.

[![](../media/scale-whole-tree.png)](https://gmod.org/JBrowseMSA/demo/#data=%7B%22msaview%22%3A%7B%22type%22%3A%22MsaView%22%2C%22height%22%3A1900%2C%22treeAreaWidth%22%3A130%2C%22colWidth%22%3A0.3%2C%22rowHeight%22%3A1%2C%22colorSchemeName%22%3A%22nucleotide%22%2C%22msaFilehandle%22%3A%7B%22uri%22%3A%22data%2Fscale%2Frsv-full.aln%22%7D%2C%22treeFilehandle%22%3A%7B%22uri%22%3A%22data%2Fscale%2Frsv-full.nh%22%7D%7D%7D)

All 1,840 tips and the G gene alignment beside them. Neither the labels nor the
letters are legible at this row height. The figure shows the outline of the tree
and a wide pale gap partway down the alignment, a deletion carried by a large
fraction of the rows.

## 3. Collapse a clade

Clicking a node in the tree collapses everything under it into one triangle. The
build script picks a clade whose descendants all share one clade call and one
country:

```
collapse target: node-0-0-1, 49 tips, clade A.1, all USA
```

[![](../media/scale-collapsed.png)](https://gmod.org/JBrowseMSA/demo/#data=%7B%22msaview%22%3A%7B%22type%22%3A%22MsaView%22%2C%22height%22%3A350%2C%22treeAreaWidth%22%3A360%2C%22colWidth%22%3A0.3%2C%22rowHeight%22%3A10%2C%22scrollY%22%3A-17800%2C%22colorSchemeName%22%3A%22nucleotide%22%2C%22collapsed%22%3A%5B%22node-0-0-1%22%5D%2C%22msaFilehandle%22%3A%7B%22uri%22%3A%22data%2Fscale%2Frsv-full.aln%22%7D%2C%22treeFilehandle%22%3A%7B%22uri%22%3A%22data%2Fscale%2Frsv-full.nh%22%7D%7D%7D)

Clade A.1, 49 tips and every one of them sampled in the USA, folded into the
triangle marked 49. The viewer ladderizes the tree by clade size, so the clade
sorts to the end of the row order and sits in the last 90 rows of 1,840, not the
first as in the file.

## 4. Subsample for a readable page

Row labels and letters are not readable at 1,840 rows, so the remaining figures
use every 10th tip in the file's order. The selection is deterministic, so a
reader reproducing it on their own tree needs no random seed.

```
subsample: 184 of 1840 tips (every 10th)
23 of 24 clades represented in the subsample
```

[![](../media/scale-subsample.png)](https://gmod.org/JBrowseMSA/demo/#data=%7B%22msaview%22%3A%7B%22type%22%3A%22MsaView%22%2C%22height%22%3A700%2C%22treeAreaWidth%22%3A420%2C%22colWidth%22%3A0.3%2C%22rowHeight%22%3A16%2C%22colorSchemeName%22%3A%22nucleotide%22%2C%22msaFilehandle%22%3A%7B%22uri%22%3A%22data%2Fscale%2Frsv-sample.aln%22%7D%2C%22treeFilehandle%22%3A%7B%22uri%22%3A%22data%2Fscale%2Frsv-sample.nh%22%7D%7D%7D)

The subsample has 184 rows, and at this row height every strain name beside the
tree is legible. Only one of the 24 Nextstrain clades in the full tree has no
representative left.

## 5. Zoom in on the variable end

This view is at base resolution over columns 5442-5541, inside the _G_
ectodomain, where every one of the 100 columns varies somewhere in the
subsample.

[![](../media/scale-zoom-variable.png)](https://gmod.org/JBrowseMSA/demo/#data=%7B%22msaview%22%3A%7B%22type%22%3A%22MsaView%22%2C%22height%22%3A650%2C%22treeAreaWidth%22%3A170%2C%22colWidth%22%3A14%2C%22rowHeight%22%3A16%2C%22scrollX%22%3A-76034%2C%22colorSchemeName%22%3A%22nucleotide%22%2C%22msaFilehandle%22%3A%7B%22uri%22%3A%22data%2Fscale%2Frsv-sample.aln%22%7D%2C%22treeFilehandle%22%3A%7B%22uri%22%3A%22data%2Fscale%2Frsv-sample.nh%22%7D%7D%7D)

Every column here carries more than one letter, and a block of rows in the
middle of the window runs to gap. That gap is the deletion that showed up as a
pale stripe in the whole-tree figure.

## 6. Zoom in on the conserved end

The same view scrolled to columns 10132-10231, inside _L_.

[![](../media/scale-zoom-conserved.png)](https://gmod.org/JBrowseMSA/demo/#data=%7B%22msaview%22%3A%7B%22type%22%3A%22MsaView%22%2C%22height%22%3A650%2C%22treeAreaWidth%22%3A170%2C%22colWidth%22%3A14%2C%22rowHeight%22%3A16%2C%22scrollX%22%3A-141694%2C%22colorSchemeName%22%3A%22nucleotide%22%2C%22msaFilehandle%22%3A%7B%22uri%22%3A%22data%2Fscale%2Frsv-sample.aln%22%7D%2C%22treeFilehandle%22%3A%7B%22uri%22%3A%22data%2Fscale%2Frsv-sample.nh%22%7D%7D%7D)

Almost every row reads the same letter down almost every column. A handful of
rows carry a substitution, and no row in this window has a gap.

## 7. Count the variable columns

The build script counts, over each whole gene of the subsampled alignment and
over the two 100-column windows above, how many columns hold more than one
letter:

```python
def variable_columns(seqs, start1, end1):
    count = 0
    for col in range(start1 - 1, end1):
        alleles = {s[col] for s in seqs} - {ord("N")}
        count += len(alleles) > 1
    return count
```

```
G gene: 612/966 variable columns (63.4%)
L gene: 1802/6498 variable columns (27.7%)
G hotspot (5442-5541): 100/100 variable columns
L coldspot (10132-10231): 15/100 variable columns
```

Over each whole gene, _G_ is more than twice as variable as _L_: 63.4% of its
columns differ somewhere in the subsample, against 27.7% of _L_'s.

## 8. The row table

A channel reads its field from a row table keyed by row name. Every tip in the
auspice JSON has a `node_attrs` object, and four of its entries hold the fields
the rest of this page draws with:

```python
def fields_for(node_attrs):
    num_date = node_attrs.get("num_date", {}).get("value")
    return {
        "clade": node_attrs.get("clade_membership", {}).get("value", "NA"),
        "country": node_attrs.get("country", {}).get("value", "NA"),
        "region": node_attrs.get("region", {}).get("value", "NA"),
        "year": str(int(num_date)) if num_date is not None else "NA",
    }
```

The script writes one record per subsampled tip, keyed by its row name:

```
wrote ./rsv-sample-rowdata.json: 184 rows, 21 kB
  clade: 23 distinct values
  country: 28 distinct values
  region: 7 distinct values
  year: 37 distinct values
  clade A.D: 38 rows
  clade A.D.1: 25 rows
  clade A.3.1: 22 rows
  clade A.D.3: 13 rows
  clade A.3: 12 rows
  clade A.D.2.2: 12 rows
```

The 184 rows carry 23 distinct clade calls and 28 countries, and the file
holding them is 21 kB. Percent-encoded into a link the table runs past 20,000
characters, so the snapshot names the file instead, which keeps the link short,
and the viewer fetches it at startup:

```json
{
  "type": "MsaView",
  "msaFilehandle": { "uri": "data/scale/rsv-sample.aln" },
  "treeFilehandle": { "uri": "data/scale/rsv-sample.nh" },
  "treeMetadataFilehandle": { "uri": "data/scale/rsv-sample-rowdata.json" }
}
```

[![](../media/phylogeny_metadata-row-table.png)](https://gmod.org/JBrowseMSA/demo/#data=%7B%22msaview%22%3A%7B%22type%22%3A%22MsaView%22%2C%22height%22%3A700%2C%22treeAreaWidth%22%3A560%2C%22colWidth%22%3A0.3%2C%22rowHeight%22%3A18%2C%22drawLabels%22%3Atrue%2C%22scrollY%22%3A-1188%2C%22colorSchemeName%22%3A%22nucleotide%22%2C%22msaFilehandle%22%3A%7B%22uri%22%3A%22data%2Fscale%2Frsv-sample.aln%22%7D%2C%22treeFilehandle%22%3A%7B%22uri%22%3A%22data%2Fscale%2Frsv-sample.nh%22%7D%2C%22treeMetadataFilehandle%22%3A%7B%22uri%22%3A%22data%2Fscale%2Frsv-sample-rowdata.json%22%7D%7D%7D)

Thirty-eight of the 184 rows at a row height that draws labels, with the table
loaded and no channel reading it. Every tip label is in the theme's text color,
and the callout names the four fields the table gives the row it points at.

## 9. Tip labels colored by clade

An `encodings` record names the channel to paint, the field feeding it and the
scale between them. The `tipLabel` channel colors the label beside each tip:

```json
"encodings": [{ "channel": "tipLabel", "field": "clade" }]
```

With 23 clade calls in the table, the field runs past the end of every named
palette, so leaving out `scale` gives each value an evenly spaced hue. The
legend in the top right lists all 23 under the field's name. The script prints
the display rows of each clade run of eight rows or more:

```
display rows 72-79: A.D
display rows 80-92: A.D.3
display rows 93-108: A.D
```

[![](../media/phylogeny_metadata-tip-labels.png)](https://gmod.org/JBrowseMSA/demo/#data=%7B%22msaview%22%3A%7B%22type%22%3A%22MsaView%22%2C%22height%22%3A700%2C%22treeAreaWidth%22%3A560%2C%22colWidth%22%3A0.3%2C%22rowHeight%22%3A18%2C%22drawLabels%22%3Atrue%2C%22scrollY%22%3A-1188%2C%22colorSchemeName%22%3A%22nucleotide%22%2C%22encodings%22%3A%5B%7B%22channel%22%3A%22tipLabel%22%2C%22field%22%3A%22clade%22%7D%5D%2C%22msaFilehandle%22%3A%7B%22uri%22%3A%22data%2Fscale%2Frsv-sample.aln%22%7D%2C%22treeFilehandle%22%3A%7B%22uri%22%3A%22data%2Fscale%2Frsv-sample.nh%22%7D%2C%22treeMetadataFilehandle%22%3A%7B%22uri%22%3A%22data%2Fscale%2Frsv-sample-rowdata.json%22%7D%7D%7D)

The same 38 rows with `drawLabels: true` and a row height of 18, scrolled to
display row 66. The labels turn from green to purple on row 80, where the last
A.D tip gives way to the first A.D.3 tip, and back to green on row 93. The
legend carries one swatch per clade call.

## 10. Branches colored by clade

The `branch` channel gives an internal node the field value its tips agree on
and colors the edge above it. Clade calls nest inside one another, so the tips
under a node agree wherever a single named clade covers them:

```json
"encodings": [{ "channel": "branch", "field": "clade" }]
```

The build script counts the same thing off the tree it pruned:

```
pruned tree: 184 tips, 363 edges
branch by clade: 293/363 edges colored, 109/179 of them above an internal node
```

Each of the 184 terminal edges takes a color, since one tip agrees with itself,
which leaves the 179 internal edges as the count worth reading: 109 of them take
a clade color.

[![](../media/phylogeny_metadata-branch-clade.png)](https://gmod.org/JBrowseMSA/demo/#data=%7B%22msaview%22%3A%7B%22type%22%3A%22MsaView%22%2C%22height%22%3A1472%2C%22treeAreaWidth%22%3A700%2C%22colWidth%22%3A0.3%2C%22rowHeight%22%3A8%2C%22drawLabels%22%3Afalse%2C%22colorSchemeName%22%3A%22nucleotide%22%2C%22encodings%22%3A%5B%7B%22channel%22%3A%22branch%22%2C%22field%22%3A%22clade%22%7D%5D%2C%22msaFilehandle%22%3A%7B%22uri%22%3A%22data%2Fscale%2Frsv-sample.aln%22%7D%2C%22treeFilehandle%22%3A%7B%22uri%22%3A%22data%2Fscale%2Frsv-sample.nh%22%7D%2C%22treeMetadataFilehandle%22%3A%7B%22uri%22%3A%22data%2Fscale%2Frsv-sample-rowdata.json%22%7D%7D%7D)

All 184 rows at a row height of 8 with the tree area widened to 700 px. Color
runs from the point where each clade splits off out to its tips: green for A.D,
purple for A.D.3, magenta for A.D.5. The backbone from the root down to those
splits draws black, because the tips under those deep nodes carry more than one
clade call between them.

## 11. Branches colored by country

The `branch` channel over the `country` field asks whether the 28 countries fall
on the tree the way the 23 clades do:

```json
"encodings": [{ "channel": "branch", "field": "country" }]
```

```
branch by clade: 293/363 edges colored, 109/179 of them above an internal node
branch by country: 207/363 edges colored, 23/179 of them above an internal node
```

Twenty-three of the 179 internal edges carry a country color, against 109 for
clade.

[![](../media/phylogeny_metadata-branch-country.png)](https://gmod.org/JBrowseMSA/demo/#data=%7B%22msaview%22%3A%7B%22type%22%3A%22MsaView%22%2C%22height%22%3A1472%2C%22treeAreaWidth%22%3A700%2C%22colWidth%22%3A0.3%2C%22rowHeight%22%3A8%2C%22drawLabels%22%3Afalse%2C%22colorSchemeName%22%3A%22nucleotide%22%2C%22encodings%22%3A%5B%7B%22channel%22%3A%22branch%22%2C%22field%22%3A%22country%22%7D%5D%2C%22msaFilehandle%22%3A%7B%22uri%22%3A%22data%2Fscale%2Frsv-sample.aln%22%7D%2C%22treeFilehandle%22%3A%7B%22uri%22%3A%22data%2Fscale%2Frsv-sample.nh%22%7D%2C%22treeMetadataFilehandle%22%3A%7B%22uri%22%3A%22data%2Fscale%2Frsv-sample-rowdata.json%22%7D%7D%7D)

The same view over the country field. Color reaches one or two edges deep at the
tips, where a pair of genomes from one country sit together, and the tree inside
each clade stays black. The run of pink at the top left is the one country
cluster big enough to see at this scale, USA genomes on display rows 12 to 18
sampled between 1981 and 1996.

## 12. Rows tinted by clade

The `rowTint` channel washes a color across the whole row, the tree gutter and
the alignment together. One record draws a band for each of the 23 clades in the
table:

```json
"encodings": [{ "channel": "rowTint", "field": "clade" }]
```

```
display rows 109-117: A.D.1
display rows 121-136: A.D.1
display rows 146-157: A.D.2.2
```

[![](../media/phylogeny_metadata-row-tint.png)](https://gmod.org/JBrowseMSA/demo/#data=%7B%22msaview%22%3A%7B%22type%22%3A%22MsaView%22%2C%22height%22%3A1472%2C%22treeAreaWidth%22%3A130%2C%22colWidth%22%3A0.3%2C%22rowHeight%22%3A8%2C%22drawLabels%22%3Afalse%2C%22colorSchemeName%22%3A%22nucleotide%22%2C%22encodings%22%3A%5B%7B%22channel%22%3A%22rowTint%22%2C%22field%22%3A%22clade%22%7D%5D%2C%22msaFilehandle%22%3A%7B%22uri%22%3A%22data%2Fscale%2Frsv-sample.aln%22%7D%2C%22treeFilehandle%22%3A%7B%22uri%22%3A%22data%2Fscale%2Frsv-sample.nh%22%7D%2C%22treeMetadataFilehandle%22%3A%7B%22uri%22%3A%22data%2Fscale%2Frsv-sample-rowdata.json%22%7D%7D%7D)

All 184 rows, each tint running from the left edge of the tree gutter across the
alignment at 25% opacity, so the nucleotide colors under it stay readable. The
purple band on rows 80 to 92 is A.D.3, with A.D green on either side of it. A.D
splits into separate runs because sub-clades such as A.D.3 and A.D.1 branch off
from inside it, and a tip with no more specific call keeps the label A.D
wherever it sits. The blue band on rows 146 to 157 is A.D.2.2. The alignment is
the whole genome at a small column width, wider than the viewport, so the viewer
draws the minimap across the top.

## 13. A rectangle over one clade

A `clades` record marks a clade of the tree. `mrca` names two tips whose common
ancestor is the clade, and `tips` is the leaf count the producer measured under
that ancestor:

```json
"clades": [
  {
    "mrca": ["330103036|A.D.3|France|2019", "MZ151852|A.D.3|Russia|2020"],
    "tips": 13,
    "mark": "highlight",
    "color": "#ffd54f"
  }
]
```

The script picks both names and the count. It walks the pruned tree for the
clade calls whose tips are exactly the tips under one node, and takes the
largest:

```
13 of the 23 clades are one node's tips
largest of them: A.D.3, 13 tips
  mrca tips: 330103036|A.D.3|France|2019 and MZ151852|A.D.3|Russia|2020
A.D.3 spans display rows 80-92
```

The two names sit under different children of that node, so their common
ancestor is the node itself whatever the tree does below them. The viewer
resolves the ancestor, counts the leaves under it and compares the count with
the 13 in the record. Writing 12 there drops the rectangle, so a re-rooted or
re-estimated tree loses the mark while the count guards which clade it covers.

[![](../media/phylogeny_metadata-clade-highlight.png)](https://gmod.org/JBrowseMSA/demo/#data=%7B%22msaview%22%3A%7B%22type%22%3A%22MsaView%22%2C%22height%22%3A700%2C%22treeAreaWidth%22%3A560%2C%22colWidth%22%3A0.3%2C%22rowHeight%22%3A18%2C%22drawLabels%22%3Atrue%2C%22scrollY%22%3A-1188%2C%22colorSchemeName%22%3A%22nucleotide%22%2C%22encodings%22%3A%5B%7B%22channel%22%3A%22tipLabel%22%2C%22field%22%3A%22clade%22%7D%5D%2C%22clades%22%3A%5B%7B%22mrca%22%3A%5B%22330103036%7CA.D.3%7CFrance%7C2019%22%2C%22MZ151852%7CA.D.3%7CRussia%7C2020%22%5D%2C%22tips%22%3A13%2C%22mark%22%3A%22highlight%22%2C%22color%22%3A%22%23ffd54f%22%7D%5D%2C%22msaFilehandle%22%3A%7B%22uri%22%3A%22data%2Fscale%2Frsv-sample.aln%22%7D%2C%22treeFilehandle%22%3A%7B%22uri%22%3A%22data%2Fscale%2Frsv-sample.nh%22%7D%2C%22treeMetadataFilehandle%22%3A%7B%22uri%22%3A%22data%2Fscale%2Frsv-sample-rowdata.json%22%7D%7D%7D)

The amber rectangle over display rows 80 to 92, starting at the branch point the
two named tips share and running across the tree labels and the alignment. All
13 labels inside it read A.D.3 and carry the purple the `tipLabel` channel gives
that value.

## 14. The link, and one row checked against the JSON

Every layer above is a property of the view, so the whole figure travels in one
link. The last one carries the three filehandles, two encodings and the clade
record, and moves the tint to the `region` field, which adds a second legend:

```json
"encodings": [
  { "channel": "tipLabel", "field": "clade" },
  { "channel": "rowTint", "field": "region" }
]
```

[![](../media/phylogeny_metadata-shared-link.png)](https://gmod.org/JBrowseMSA/demo/#data=%7B%22msaview%22%3A%7B%22type%22%3A%22MsaView%22%2C%22height%22%3A700%2C%22treeAreaWidth%22%3A560%2C%22colWidth%22%3A0.3%2C%22rowHeight%22%3A18%2C%22drawLabels%22%3Atrue%2C%22scrollY%22%3A-1188%2C%22colorSchemeName%22%3A%22nucleotide%22%2C%22encodings%22%3A%5B%7B%22channel%22%3A%22tipLabel%22%2C%22field%22%3A%22clade%22%7D%2C%7B%22channel%22%3A%22rowTint%22%2C%22field%22%3A%22region%22%7D%5D%2C%22clades%22%3A%5B%7B%22mrca%22%3A%5B%22330103036%7CA.D.3%7CFrance%7C2019%22%2C%22MZ151852%7CA.D.3%7CRussia%7C2020%22%5D%2C%22tips%22%3A13%2C%22mark%22%3A%22highlight%22%2C%22color%22%3A%22%23ffd54f%22%7D%5D%2C%22msaFilehandle%22%3A%7B%22uri%22%3A%22data%2Fscale%2Frsv-sample.aln%22%7D%2C%22treeFilehandle%22%3A%7B%22uri%22%3A%22data%2Fscale%2Frsv-sample.nh%22%7D%2C%22treeMetadataFilehandle%22%3A%7B%22uri%22%3A%22data%2Fscale%2Frsv-sample-rowdata.json%22%7D%7D%7D)

Labels colored by clade, rows tinted by region, the A.D.3 rectangle over rows 80
to 92, and two legends stacked in the top right, one per field. The region tint
changes color from row to row inside the rectangle, where the clade colors held
one band. The red box marks the row the check below reads.

The row in the box is the tip the build script prints last, with its entry in
the auspice JSON beside the record the table gives it:

```
check tip: RSVA/20200035/BJ/CHN/2020.01.09|A.D.3|China|2020, display row 88
  node_attrs: {"clade_membership": {"value": "A.D.3"}, "country": {"value": "China", "confidence": {"China": 1.0}, "entropy": -1.000088900581841e-12}, "region": {"value": "Asia"}, "num_date": {"value": 2020.0232240437158}}
  row: {"clade": "A.D.3", "country": "China", "region": "Asia", "year": "2020"}
```

On screen that row has a purple label, the A.D.3 color in the clade legend; it
sits inside the amber rectangle, whose 13 tips are the A.D.3 clade; and its tint
is the Asia color in the region legend. The date rounds down to the year 2020,
which is the last field of the row name the tree already carried.

## Reproduce it end to end

[`build_phylogeny_at_scale.py`](https://github.com/GMOD/JBrowseMSA/blob/main/docs/tutorials/scripts/build_phylogeny_at_scale.py)
is the script step 1 runs, and it builds every file on this page:

1. It fetches Nextstrain's RSV-A build and rebuilds each tip's genome from the
   root sequence and the substitutions on the tip's root-to-tip path, so the
   rows come out aligned without an aligner.
2. It writes all 1,840 tips sliced to the _G_ gene, and every 10th tip as whole
   genomes, each with a tree pruned to its tips.
3. It writes the subsample's clade, country, region and year as a row table
   keyed by row name, the names the alignment and the tree carry.
4. It prints the numbers the page quotes: the clade to collapse, the variable
   columns per gene, the edges each field colors, and one tip checked against
   its raw metadata.

It needs the tools under [Prerequisites](#prerequisites).

```bash
curl -O https://raw.githubusercontent.com/GMOD/JBrowseMSA/main/docs/tutorials/scripts/build_phylogeny_at_scale.py
python3 build_phylogeny_at_scale.py .
```

The argument is the directory to write to.

## See also

- [An H5N1 surveillance figure](https://gmod.org/JBrowseMSA/tutorials/influenza_surveillance_figure)
- [A protein family from a list of accessions](https://gmod.org/JBrowseMSA/tutorials/protein_family)
- [User guide](https://gmod.org/JBrowseMSA/guide)
- [Data layers](https://gmod.org/JBrowseMSA/layers)

## References

- Hadfield J, Megill C, Bell SM, et al. Nextstrain: real-time tracking of
  pathogen evolution. _Bioinformatics_ 34:4121-4123.
- Johnson PR, Spriggs MK, Olmsted RA, Collins PL. The G glycoprotein of human
  respiratory syncytial viruses of subgroups A and B: extensive sequence
  divergence between antigenic subgroups. _Proc Natl Acad Sci USA_ 84:5625-5629.
- Goya S, Galiano M, Nauwelaers I, et al. Toward unified molecular surveillance
  of RSV: a proposal for genotype definition and nomenclature harmonized with
  WHO clinical severity groups. _Influenza Other Respir Viruses_ 14:274-285.
- Yu G, Smith DK, Zhu H, Guan Y, Lam TT. ggtree: an R package for visualization
  and annotation of phylogenetic trees with their covariates and other
  associated data. _Methods Ecol Evol_ 8:28-36.
