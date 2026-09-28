# Scales and guides

Every scale in react-msaview is categorical. `resolveScale` in
`packages/lib/src/scales.ts` reads a `ScaleSpec` of `{palette, map}` and returns
a colour per distinct string value, and `encodings`, the `strip` and `features`
row panels and `colorScheme` all read it. A number has no scale to go through,
so a strip over a sampling date, a feature fill over pLDDT, a node coloured by
support and a bar per row are each blocked on the same missing piece. This
document adopts the colour object jbrowse-components' displays declare, adds the
continuous and threshold scales it names, gives every scale its guide, a legend
or an axis, and lists the marks those unlock.
[panels-and-marks](panels-and-marks.md) holds the vocabulary of panels, marks
and channels this builds on.

Two target figures, in order of work:

- **A surveillance tree with a date strip.** The RSV tree of
  `docs/tutorials/phylogeny_metadata.md` with its lineage strip, and beside it a
  strip of collection years through a `viridis` ramp with a gradient legend, and
  the tips coloured by the same ramp.
- **A protein with per-residue confidence.** A kinase alignment with an
  AlphaFold pLDDT column track as a heatmap row through a threshold scale at 50,
  70 and 90, the four intervals in the legend, and a dN/dS bar track coloured
  red above 1 and blue below it.

## Vocabulary

- **Colour object.** The members a channel declares to read a field into a
  colour: `field`, `scale`, `domain`, `range`, `scheme`, `domainMin`,
  `domainMax`, `domainMid`, `domainQuantile`, `reverse`, `title`, `labels`,
  `missingLabel`. jbrowse-components spells it this way on every display
  (`packages/core/src/util/colorScale.ts` there, and its
  `config_guides/mark_display.md`), and its ADR-151 replaced an earlier
  `palette` member with `range`. react-msaview's `{palette, map}` is that
  earlier spelling.
- **Scale kind.** The `scale` member: `categorical`, `linear`, `log` or
  `threshold`. A categorical scale hands a `range` colour to each distinct
  value. A linear or log scale samples a ramp between `domainMin` and
  `domainMax`. A threshold scale cuts the number line at the values `domain`
  lists and hands `range` one colour per interval, so `range` is one longer than
  `domain`.
- **Value scale.** The scale a bar or point mark reads its value through into a
  length: `{type, domainMin, domainMax, domainQuantile}`, spelled `scales.y` on
  a column track and `scales.x` on a row panel, the axis each one draws along.
- **Guide.** What a reader checks a scale against. A colour scale has a legend,
  a value scale has an axis. A guide derives from its scale and takes no record
  of its own.
- **Declaration.** The members of a scale as written, with `field` left out. Two
  records whose declarations match read one scale over the union of their
  fields' values and list one legend. This is Vega-Lite's shared `resolve` and
  ggplot2's one scale per aesthetic, and jbrowse-components' rule in ADR-136.

## The spelling today, and the target

| Today                        | Target                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------- |
| `{ "palette": "set1" }`      | `{ "scale": "categorical", "range": "set1" }`                                                |
| `{ "map": { "a": "#e41" } }` | `{ "domain": ["a"], "range": ["#e41"] }`                                                     |
| a strip's `legend`           | `title` on the scale                                                                         |
| a bar track's `max`          | `scales.y.domainMax`                                                                         |
| a text track's `colors`      | `encoding.color` with `domain` and `range`                                                   |
| a bar track's `color`        | `encoding.color.value`, with `color` kept as the shorthand                                   |
| absent                       | `linear`, `log`, `threshold`, `scheme`, the domain ends, `reverse`, `labels`, `missingLabel` |

`range` takes a list of colours or a palette name. The names stay `ggplot`,
`set1`, `dark2`, `okabeito` and `tableau`, and `okabeIto` and `tableau10` read
as aliases, since those are the names jbrowse-components' `paletteFromSpec`
accepts. `scheme` names a ramp from the same table jbrowse-components bakes:
`viridis`, `magma`, `inferno`, `cividis`, `reds`, `blues`, `redblue` and
`purpleorange`. A linear scale with neither `range` nor `scheme` samples
`viridis`.

`encodings` and `rowPanels` travel in shared URLs, so the model reads both
spellings: `{palette: p}` reads as `{range: p}`, `{map: m}` as
`{domain: Object.keys(m), range: Object.values(m)}`, `legend` as `title`, `max`
as `scales.y.domainMax` and `colors` as a categorical `encoding.color`. The
docs, the examples, the R and Python wrappers and every new test write the
target spelling. `bgColor` and `showDomainLegend` set the precedent for a name
that stays readable after its public spelling moves.

## Decisions

### One colour object on every channel

The object above replaces `ScaleSpec` and is the type of `Encoding.scale`,
`RowStripSpec.scale`, `FeatureEncodingSpec.color`, a column track's
`encoding.color` and a `bar` or `point` row panel's `encoding.color`. A
`features` panel's `encoding.color` today is `{field, scale}` with the scale
nested; the members flatten onto the channel, so `encoding.color` is
`{field, scale: "categorical", range: "set1"}`. jbrowse-components ruled the
same way in ADR-151: a channel carries its scale's members and nests no scale
object.

`scale` left unset is `categorical`, which is what every record written so far
means. A field whose every value parses as a number still takes categorical
colours until the record says `scale: "linear"`, and its legend carries a note
saying so, the way jbrowse-components' `CategoricalScale.note` does, so a
producer who meant a ramp sees which member to write. A preset table keyed by
field name, jbrowse-components' `score` to `linear` and `strand` to red and
blue, is declined below.

`resolveScale(spec, values)` returns a `ResolvedScale` of `kind`, `colorOf` and
`legend`, as it does now, and gains a `kind` per scale. `colorOf` takes the
string the field holds, and the continuous kinds parse it, so `rowData`'s string
coercion and GFF attributes need no change. A value that fails to parse falls
under `missingLabel`, grey in the legend.

### A categorical scale over several records resolves one domain

Two strips over one palette resolve their domains apart today, so a value both
fields hold takes two colours. With the two-strip example in `docs/layers.md`,
PB2 over `am2.2, am4` and PB1 over `am4, eu1` through `set1`, `am4` is `#377eb8`
in the first strip and `#e41a1c` in the second, and the shared `legend` title
merges the entries by id and keeps the first, so the key shows a colour the
second strip never draws. A two-line call of `resolveScale` over those two value
lists reproduces it, and the test in step 1 pins the fix.

The fix keys resolution on the declaration. `resolvedScales` groups every
record's colour object by its members with `field` left out, resolves each group
once over the union of its fields' values, and hands each record the group's
`colorOf`. Two strips over `{range: "set1", title: "segment lineage"}` colour
`am4` alike, and two strips over `{range: "set1"}` with no title are two fields,
two legends and two scales, which is what their two legends say. `domain` on the
object lists values in legend order and spends `range` from the first entry, so
a producer who wants a fixed order writes it once.

A top-level `scales` map with named entries, Vega-Lite's shared scale by name,
was considered and declined. jbrowse-components refused a display-level
`scales.color` on 2026-09-23 because marks declaring a scale alike already share
one and a named map is a second spelling for it. The same holds here.

### An open ramp is per record, and a pinned one shares

A linear or log scale with an end unset takes that end from the record's own
values, clipped at `domainQuantile`, and a ramp whose domain follows its own
data cannot share a legend with another record's. A ramp pinned at both ends is
its declaration, so two strips over
`{scale: "linear", scheme: "viridis", domainMin: 2019, domainMax: 2023}` share
one gradient legend. This is jbrowse-components' rule in ADR-136 as amended
2026-09-23, and it means a figure pins both ends.

`domainQuantile` defaults to 1, the loaded values' extremes. Below 1 each end
clips its own tail, the value past the clip draws at the end colour, and the
legend prints the clipped ends. jbrowse-components settled this in ADR-179 after
checking ggplot2, Vega-Lite, Observable Plot and GenomeSpy, none of which name a
robust domain; it is here because one outlier date or one huge genome flattens a
strip to one colour.

### Domain order is natural sort, listed values first

`resolveScale` sorts the domain with `localeCompare`, which puts `10` before `2`
and `chr10` before `chr2`. The order becomes the one jbrowse-components'
`compareGroupKeys` states: the values `domain` lists first in that order, then
numbers by value, then every other value run by run with digit runs compared by
magnitude, so `2.3.4.4b` sorts after `2.3.2.1a` and `H5N1` before `H5N8`. A
value the field lacks takes no row, and `missingLabel` names the grey row for a
row with no value. The comparator is about forty lines and is copied, with its
source path in the comment, under the rule below.

### The legend is a `LegendSpec`

`Legend` in `types.ts` is `{id, title, entries: {id, label, color}[]}`, and
`legendRows` flattens the list for `AnnotationLegend.tsx` and `LegendSVG`. The
type becomes jbrowse-components' `LegendSpec` shape from
`packages/core/src/ui/legendSpec.ts` there: a section is
`{id, title, note, items}`, an item is `{value, label, color}` or
`{label, gradient}`, and a gradient is `{stops, minLabel, maxLabel}`.
`legendRows` becomes `legendEntries`, the same flattening with a gradient row
and a note row, and both renderings gain the two row kinds. On screen a gradient
row is a CSS `linear-gradient` over the stops; in the export it is a
`<linearGradient>` in `<defs>` and a `<rect>` filled by it, which the React half
of `renderToSvg.tsx` emits, so `packages/svgcanvas` still draws no gradient. A
legend past twenty rows lists the twenty and a `+N more` note,
jbrowse-components' `MAX_LEGEND_ITEMS`.

Every scale from a colour object lists one legend section keyed by its
declaration and titled by `title`, else by `field`. The domain overlay's
accession key stays the one producer with no field.

### Every scale reports its problems

`residueMappingProblems` lists why a mapping is ignored, and no scale does the
same. `scaleProblems` on the model lists, per record, the combinations no single
member can refuse: `domainMax` below `domainMin`, a threshold whose `domain` is
unsorted or whose `range` is not one longer, a `domainQuantile` outside 0.5 to
1, `labels` of a different length from `domain`, a `scheme` no table holds. The
legend carries the first as its section's note, the CLI's `export-svg --spec`
prints them all to stderr, and `MSAViewer` exposes them the way it exposes the
mapping problems. The rules and their messages are jbrowse-components'
`colorProblems` and `scaleEndProblems`, copied.

### An axis is the guide of a value scale

A `features` panel with `x: "position"` maps each row's residue positions onto
the panel width through a linear scale and draws no ruler, so a gene
neighbourhood carries no kilobase scale. A `bar` or `point` row panel has the
same scale along its width. `drawAxis` in a new `components/axis.ts` takes a
value scale, a pixel extent and an orientation and draws the ticks and labels,
on a canvas or the svgcanvas Context, with the 1/2/5 tick ladder the tree scale
bar uses. A row panel draws its axis in the header band, where its header is, so
the band's height holds; a column track with a value scale draws it down its
left edge over the label gutter, where `TrackLabelsSVG` puts the name. The tree
scale bar and the position ruler stay as they are; they are the axes of the
branch-length and column scales and already derive from them.

`scales.y` on a column track and `scales.x` on a row panel carry `type`
(`linear` or `log`), `domainMin`, `domainMax` and `domainQuantile`. A bar
track's `max` reads as `scales.y.domainMax`, and a bar with neither draws
`values` as fractions of 1, as today.

### New marks on both axes

The panels-and-marks doc promised one kind vocabulary on both axes, and the row
axis has `strip` and `features` where the column axis has `bar`, `text`, `arc`,
`logo` and `ruler`. The scales above give each new kind its channels.

- **`bar` and `point` row panels** over a numeric `rowData` field, the value
  along the panel width through `scales.x`, with an optional `encoding.color`
  over the same or another field. This is ggtree's `geom_facet(geom_col)` and
  `geom_facet(geom_point)`: genome size, sampling date, a trait. `width`
  defaults to 80.
- **A `text` row panel** prints a `rowData` field beside the tips, the way a
  tip-aligned table does, in the panel's width.
- **A `strip` column track**: one cell per column coloured from `values` through
  `encoding.color`, a heatmap row. pLDDT per residue, disorder, a hydropathy
  scale. It is the column twin of the row strip and shares its legend machinery.
- **`encoding.color` on a `bar` column track** over `values`, so a threshold
  scale at 1 colours dN/dS, and on a `text` column track in place of `colors`.
- **`nodePoint` in `encodings`**, reading each internal node's support value
  through a colour object and filling the node bubble, which `drawNodeBubbles`
  draws in one colour today. ggtree's `geom_nodepoint(aes(color = support))`.
- **`rowLabel` in `encodings`**, naming the `rowData` field drawn as the tip
  label. The label reads a `genome` field at `model.ts:2657` and
  `renderTreeCanvas.ts:407` today, which becomes the default when no encoding
  names a field. jbrowse-components spells the same thing as a `rows.labels`
  map.

The column-track legends need a producer: `legends` reads the overlay, the
row-table encodings and the row panels, and a text track's `colors` lists no key
today.

### Copy the shapes, import nothing new

`@jbrowse/core` 5.0.0-beta.9, the version `packages/lib` pins, ships
`ui/legendSpec`, `ui/colorScale`, `util/colorSchemes`, `util/colorRamp` and
`util/groupKeys`, and does not ship `util/colorScale`, which holds the presets
and the problem rules. The downstream plugin resolves core against the host
jbrowse-web, and the msafam site is on core 3.2, so a new core import is
`undefined` on a deployed host, the rule `CLAUDE.md` states under
`@jbrowse/core` externals. The types, the comparator, the scheme stop tables and
the problem rules are copied into `packages/lib/src` with the source path in a
comment, the way `statusMessageText` and `renderToStaticMarkup` were. A later
core release that every host runs can replace the copies with imports in one
commit.

### Declined

- **A preset per field name.** jbrowse-components reads `score` through a ramp
  and `strand` through red and blue before a config says so. No field of
  `rowData` or a GFF has one meaning across figures, and `strand` already picks
  the arrow glyph. A record writes `scale: "linear"`.
- **`identity` as a scale kind.** A GFF `color=` attribute already colours its
  own feature ahead of any scale. Declaring it adds a word for what happens.
- **`jexl` channels.** A derived value is computed by the agent that wrote the
  table and stored in a field, under `viewer-not-analysis-tool`.
- **A top-level `scales` map.** See the declaration rule above.
- **`opacity` and `size` channels on the span mark.** No figure has asked.
  `size` on a `point` row panel takes a number, one diameter per record.
- **A per-cell colour matrix.** See `data-layers.md`.

## The work, in order

### 1. The colour object, the shared domain and the comparator

`scales.ts`: the colour object type, `resolveScale` over `categorical` with
`range` as a list or a name, `domain` order then `compareGroupKeys`, and the
readers for `palette`, `map`, `legend`, `colors` and `max`. `model.ts`:
`resolvedScales` keyed by declaration, read by `resolvedEncodings`,
`rowPanelScales` and `featureColorMap`. `types.ts`: `Encoding`, `RowStripSpec`,
`FeatureEncodingSpec` and `ColumnTrackSpec` on the new type. Parity:
`MSAViewer.tsx`, `USAGE.md`, `msaview.R` with a `layers.R` entry,
`test-layer-coverage.R`, the Python trait and `src/render.ts`.
`scale_row_color(field, palette =)` in R takes `range =` and keeps `palette =`
as an alias. Tests: the two-strip value, the natural order, each old spelling
read. About 300 lines plus 150 of test. One day.

### 2. Continuous and threshold scales, and the gradient legend

`resolveScale` over `linear`, `log` and `threshold`: the scheme stop table,
`domainMin`, `domainMax`, `domainMid`, `domainQuantile` with the nearest-rank
quantile, `reverse`, `labels`. `types.ts`: `LegendSpec`, `legendEntries`
replacing `legendRows`, the gradient and note rows in `AnnotationLegend.tsx` and
`LegendSVG`. The first callers are a `strip` over a numeric field and
`featureFill` over a numeric attribute, which need no new mark. Tests: a
gradient in the SVG snapshot, a threshold's interval rows, a pinned ramp shared
and an open one not. About 400 lines plus 200 of test. Two days.

### 3. Scale problems

`scaleProblems` on the model, the note in the legend, the stderr lines in
`export-svg --spec`, the `MSAViewer` surface beside the mapping problems. Half a
day.

### 4. Column tracks read a colour object and a value scale

`ColumnTrackSpec` gains `encoding.color` and `scales.y`; `drawConservationBars`
takes a colour per bar; `drawTextTrackContent` reads the resolved scale; the
`strip` kind and its draw function in `drawTracks.ts`, its case in
`drawTrackBlock` and in `TrackTooltipContent.tsx`; a column-track producer in
`legends`. One day.

### 5. The axis and the row-panel marks

`components/axis.ts` with `drawAxis`; the axis on the `features` panel under
`x: "position"`, in the header band; `bar`, `point` and `text` row panels in
`renderRowPanel.ts` with `scales.x`, their `resolvedRowPanels` geometry and
their SVG export. The header band draws the axis where a header would go, so a
panel with an axis takes its header as the axis title. Two days.

### 6. Tree channels

`nodePoint` and `rowLabel` in `EncodingChannel`, read in `renderNodeBubbles` and
`renderTreeLabels`, with the `genome` fallback kept. The overview draws no node
points. One day.

## Sequence

Steps 1 through 6 run about a week and a half. Step 1 ships alone and fixes the
shared-value defect; steps 2 and 3 ship together, since a problem list with no
continuous scale has one rule to report; steps 4, 5 and 6 each ship alone
after 2. Building step 4 or 5 before step 2 puts a second value-scale reader in
`drawTracks.ts` and a second legend shape, and then needs both replaced.

## Tutorials

The year strip joins `docs/tutorials/phylogeny_metadata.md`, whose `rowData`
table already carries a `year` per RSV genome, as one more `strip` record with
`scale: "linear"` and a pinned domain. The pLDDT track gets a tutorial of its
own: `pLDDT` is the B-factor column of an AlphaFold model's mmCIF, one value per
residue, which a script writes as a `strip` column track over the query row with
a threshold scale at 50, 70 and 90, the four confidence bands AlphaFold's own
viewer draws. The gene-neighbourhood tutorial gains a `bar` row panel of genome
size beside its `features` panel, with the axis in the header band.

## Shared code with jbrowse-components

jbrowse-components' `agent-docs/reference/GRAMMAR_OF_GRAPHICS.md` has a section
"The row panel, against ggtree and react-msaview" with a three-way table, and
its react-msaview column reads clade focus, branch lengths and clade collapse as
missing; all three exist (`clades` with `focus` and `collapse`,
`showBranchLen`). Its `packages/tree-sidebar` draws a dendrogram beside rows,
with `rotateNewickByDomain` turning each node toward the earliest listed leaf
and a note that the function lifts into `@gmod/newick` as written.
`rerootTree.ts` here carries the same note, and `mrca` in `hierarchy.ts` is the
third such function. `@gmod/newick` 1.0.3 exports the parser and the traversals.
Moving reroot, rotate-to-order and MRCA there is a change to that package and is
out of this document's scope.
