Tutorials here follow the same rules as jbrowse-components'
`website/docs/tutorials/CLAUDE.md`, which carries the reasoning. Read it before
writing one. This file names what differs, and what a page in this repo needs.

Each step gets a figure, each caption describes what is in the frame, and the
prose stays short. Use no em-dashes anywhere, including code comments. Follow
`docs/WRITING.md`.

## The shape

A tutorial is **one continuous line of work**: sequences to alignment to tree to
the layers an analysis produces, ending on a `#data=` link that opens the
result. Each step consumes what the step before produced. One dataset is the
default; a second only where the first raised the question it answers.

**Every dataset carries a built-in control**, something in the same figure that
ought to come out negative, and the page ends by checking the inference against
the raw data.

The analysis happens outside the viewer (see `viewer-not-analysis-tool` and
`docs/layers.md`). The page shows the command that produces each file the viewer
loads, in a form a reader runs on their own data; everything else lives in
`scripts/build_<topic>.sh`, which `## Reproduce it end to end` curls from GitHub
and runs. Every number in the prose is one a run of that script printed.

A pipeline that runs inside a language ships that language's script instead,
`build_<topic>.R` or `build_<topic>.py`, and the reproduce section runs it with
`Rscript` or `python`. The page's own snippets are the same code the script
runs, so a reader following along and a reader running the script get the same
files.

Section order: opening paragraph, `## Prerequisites`,
`## Where the data comes from` (one bullet per file, ending in the raw URL), the
steps, `## Reproduce it end to end`, `## See also` (bare links),
`## References`. `pnpm check:tutorials` holds the shape below.

**Prerequisites lists what the reader installs**, one bullet per tool with its
install line, and nothing else. A tool in it is one a fence on the page runs. No
convenience pitch ("every figure below links to the live view", "nothing to
install"): every page could say it, so it tells the reader nothing.

**Where the data comes from opens on who fetches the files**, because a list of
URLs under a provenance heading does not tell a reader whether to start
downloading: "The commands below fetch these, so there is nothing to download by
hand", or the same of the build script. One sentence before it names the release
and cites it. The visible list is what those commands download. The files this
repo hosts at `gmod.org/JBrowseMSA/demo/data/` stay visible only where a fence
on the page reads them; the rest go in a `<details>` under the list, summarised
"The files this page writes, hosted for the figure links", since a reader takes
every visible bullet as something to get first. A bullet standing for one
request of many says so and shows the one URL ("one sequence per accession, for
example: ..."), rather than promising all of them.

**Reproduce it end to end hands the script over with its reasoning.** Above the
`curl` fence, a numbered list of three or four steps says what the script does,
in the reader's terms and without commands, then one line points at
[Prerequisites](#prerequisites) for what it needs. A tutorial teaches the
method; the script only saves typing.

**Repeated prose is load-bearing.** The ClustalW bullet and the "the label
becomes the FASTA defline" sentence recur because each page reads from a cold
start. Keep their wording consistent rather than cutting them.

**Don't argue and don't preach.** Stop a section at the observation. No thesis
paragraph, no naming a wrong inference to refute it, no "the honest result".
Gene symbols are `_italic_` in prose and bare in captions and headings.

## Figures

A figure is a linked image followed by its caption paragraph; `wrapFigures` in
`website/astro.config.mjs` turns the pair into a `<figure>`:

```md
[![](../media/<topic>-<step>.png)](https://gmod.org/JBrowseMSA/demo/#data=...)

Caption: what the frame shows, in the frame's own terms.
```

The link opens the exact view the figure captured. Every figure is generated:

- a spec module per tutorial at `scripts/screenshots/tutorial-specs/<topic>.mjs`
  exporting `specs` (same shape as `specs.mjs`; `fileSnap` comes from
  `snap.mjs`), named `<topic>-<step>` so `--filter=<topic>` selects the page
- callouts (`annotate`) anchor on alignment columns and rows, never pixels; see
  `annotations.mjs`
- `node scripts/screenshots/generate.mjs --filter=<topic> --port=<free port>`
  after `pnpm --filter app build`

Traps the existing pages hit:

- **A callout anchor counts from 0**, where `highlights` and GFF count from 1.
  The same residue is two different numbers in the two files.
- **Row order is not the Newick file's order.** The default `treeOrder` is
  `branchLength`, which puts each node's shortest branch first, so a `scrollY`
  computed from the tree file lands somewhere else. Read the row index off
  `window.MSAVIEW_MODEL` instead.
- **An anchor that resolves can still draw off-canvas**, and nothing reports it.
  A collapsed clade outside the captured window is the usual way in, so look at
  every figure you ship.
- **`generate.mjs` serves `packages/app/dist`.** A file added or rewritten under
  `packages/app/public/data/` reaches a figure only after
  `pnpm --filter app build`, and until then the capture uses the copy from the
  last build with no warning.
- **The aligner decides the row order of its output.** ClustalW writes the rows
  in guide-tree order, so a series a reader should read in file order (by year,
  by accession) needs the file rewritten in that order after the aligner runs.
- **A tip label elides by tree depth, not label length.** `treeAreaWidth` has to
  clear the deepest row's indent plus its label, so a set of long names elides
  the rows furthest from the root while the shallow ones fit. Nothing reports
  it, and a half-drawn label reads as a whole one until you compare two rows.
- **A callout anchored `alignY: 'bottom'` draws below the drawn rows**, which is
  off the bottom of `clip: 'viewer'` whenever the rows fill the panel. The
  anchor resolves, so the unresolved-anchor guard stays quiet and the PNG comes
  out with no callout. Give `height` a band under the last row.

Hosted files the links load go under `packages/app/public/data/<topic>/`, served
at `gmod.org/JBrowseMSA/demo/data/<topic>/`, with a row in that directory's
`README.md`. Keep them small; a large public file that already sends
`Access-Control-Allow-Origin` (the InterPro API, NCBI eutils, PDBe) is loaded
from its source instead of rehosted.

Registering a page is a file here plus an entry in
`website/src/lib/tutorials.ts`.

## Live pages

A page that mounts the viewer beside another live view is a hand-written
`website/src/pages/tutorials/<slug>.astro` with its React island in
`website/src/components/`, under a slug no markdown file here uses.
`structure_link.astro` is the model: its island loads the hosted files from
`gmod.org/JBrowseMSA/demo/data/`, so it shows what the deployed app serves, and
it imports Mol\* with a dynamic `import()`, so no other page downloads it. Its
card figure comes from `scripts/screenshots/structure-link-figure.mjs`, run
against a dev server or `astro preview`. The script also prints every status
line its pointer sweep produced, which is the check that both bridges work.
