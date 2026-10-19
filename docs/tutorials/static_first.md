# An alignment on your own page, static first

A web page that mounts the viewer as it loads asks every reader for 452 KB of
gzipped JavaScript before the first residue draws, including a reader who only
scrolls past. This page draws the viewer's first frame once, as an SVG, shows
that SVG on the page, and loads the viewer when the reader clicks to explore.
The alignment is the NLRP1 family that
[A protein family from a list of accessions](https://gmod.org/JBrowseMSA/tutorials/protein_family)
builds, and the page ends by measuring both versions of the page with
Lighthouse.

The pipeline runs `npx`, which fetches react-msaview-cli, serve and Lighthouse.

## Prerequisites

- Node.js 18 or later, which brings `npx`: `apt install nodejs`, or
  `brew install node`
- Chrome or Chromium, for Lighthouse in step 6: `apt install chromium`, or
  `brew install --cask google-chrome`

## The data

The twelve NLRP1 orthologs, their ClustalW tree and their InterPro 110.0 domain
matches, as the protein family tutorial writes them. Nothing to download: the
CLI and the viewer fetch these by URL from the props file of step 1.

| What it is                               | File                                                                         |
| ---------------------------------------- | ---------------------------------------------------------------------------- |
| The alignment, 12 rows over 1666 columns | [nlrp1.aln](https://gmod.org/JBrowseMSA/demo/data/nlrp1.aln)                 |
| Its tree                                 | [nlrp1.nh](https://gmod.org/JBrowseMSA/demo/data/nlrp1.nh)                   |
| Its domains, InterPro 110.0 Pfam matches | [nlrp1-domains.gff](https://gmod.org/JBrowseMSA/demo/data/nlrp1-domains.gff) |

<details>
<summary>The files this page writes, hosted for the figure links</summary>

| What it is                                        | File                                                                        |
| ------------------------------------------------- | --------------------------------------------------------------------------- |
| The props of step 1                               | [nlrp1.json](https://gmod.org/JBrowseMSA/demo/data/static_first/nlrp1.json) |
| The first frame of step 2                         | [nlrp1.svg](https://gmod.org/JBrowseMSA/demo/data/static_first/nlrp1.svg)   |
| The page of steps 3 and 4                         | [index.html](https://gmod.org/JBrowseMSA/demo/data/static_first/index.html) |
| The same page with the viewer mounted as it loads | [live.html](https://gmod.org/JBrowseMSA/demo/data/static_first/live.html)   |

</details>

## 1. One props file for both views

`MSAViewer` takes its data and settings as props. Written to a JSON file, the
same props reach the CLI through `--props` and the viewer through `mount()`, so
the figure and the live view draw from one description. Save this as
`nlrp1.json`:

```json
{
  "msaUrl": "https://gmod.org/JBrowseMSA/demo/data/nlrp1.aln",
  "treeUrl": "https://gmod.org/JBrowseMSA/demo/data/nlrp1.nh",
  "gffUrl": "https://gmod.org/JBrowseMSA/demo/data/nlrp1-domains.gff",
  "height": 360,
  "hideHeader": true
}
```

`height` is the viewer's full height in pixels, tracks included, and
`hideHeader` leaves out the toolbar. Every prop `MSAViewer` takes can go in the
file; [Embedding](https://gmod.org/JBrowseMSA/embedding) lists them.

## 2. Draw the first frame with the CLI

```bash
npx react-msaview-cli@9.1.1 export-svg --props nlrp1.json --viewport --width 900 -o nlrp1.svg
```

The CLI fetches the three files, lays the view out at 900 pixels wide and the
props' 360 tall, and draws it with no browser. `--viewport` limits the drawing
to the frame the viewer opens on; without it the CLI draws all 1666 columns. The
build script printed 118,981 bytes for the SVG, 6,618 gzipped.

[![](../media/static_first-svg.png)](https://gmod.org/JBrowseMSA/demo/data/static_first/nlrp1.svg)

The first 61 columns of the twelve rows, under the Conservation and Property
conservation tracks, with the tree on the left. The PAAD/DAPIN/Pyrin domain
fills the cells green from column 39, the ninth residue, in Chimp, Human,
Rhesus, Dog and Hedgehog. The CLI draws the domain legend in a panel of its own
to the right of the tracks, which makes the SVG 1111 pixels wide.

## 3. Put the figure on the page

The page shows the SVG in a box as tall as the viewer's `height`, with a button
over its corner:

```html
<style>
  .msa-embed {
    position: relative;
    max-width: 900px;
    height: 360px;
  }
  .msa-embed > img {
    display: block;
    max-width: 100%;
    max-height: 100%;
  }
  .msa-explore {
    position: absolute;
    right: 8px;
    bottom: 8px;
  }
</style>

<div class="msa-embed" data-props="nlrp1.json">
  <img
    src="nlrp1.svg"
    alt="Twelve NLRP1 orthologs aligned under their tree, with the PAAD/DAPIN/Pyrin domain filled green"
  />
  <button type="button" class="msa-explore">Explore the alignment</button>
</div>
```

- The box keeps its 360 pixels when the viewer replaces the image, so the text
  under it stays where the reader left it.
- `max-width: 100%` scales the SVG to the box, and on a phone to the screen:
  Lighthouse's mobile run drew it 396 pixels wide.
- The rules name `.msa-explore` and `.msa-embed > img`. The viewer mounts its
  own buttons into the box, and the browser applies a rule on
  `.msa-embed button` to them as well, which stacks the live view's track menus
  in the Explore button's corner.

[![](../media/static_first-page.png)](https://gmod.org/JBrowseMSA/demo/data/static_first/index.html)

The page as it loads: a heading, the SVG of step 2 scaled to the 900-pixel box,
the Explore button in the box's lower right corner, and a paragraph under the
box. The page has fetched 8 KB and no JavaScript file.

## 4. Load the viewer on a click

<!-- usage: web -->

The script fetches the bundle and the props on the reader's click, then empties
the box and mounts the viewer into it:

```js
const bundle = 'https://unpkg.com/react-msaview@9.1.1/bundle/index.js'
let bundleLoaded

function loadBundle() {
  bundleLoaded ??= new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = bundle
    script.onload = resolve
    script.onerror = reject
    document.head.append(script)
  })
  return bundleLoaded
}

async function explore(box) {
  const button = box.querySelector('.msa-explore')
  button.disabled = true
  button.textContent = 'Loading…'
  const [props] = await Promise.all([
    fetch(box.dataset.props).then(res => res.json()),
    loadBundle(),
  ])
  box.replaceChildren()
  window.ReactMSAView.mount(box, props)
}

for (const box of document.querySelectorAll('.msa-embed')) {
  box
    .querySelector('.msa-explore')
    .addEventListener('click', () => explore(box), {
      once: true,
    })
}
```

`loadBundle` keeps its one promise, so a page with several boxes downloads the
bundle on the first click and reuses it on every later one.

[![](../media/static_first-explore.png)](https://gmod.org/JBrowseMSA/demo/data/static_first/index.html)

The page of step 3 after the click. The viewer fills the box: the minimap across
the top, the two tracks with their menus, the tree and the twelve rows, and the
domain legend over the right of the alignment. The paragraph under the box has
not moved.

<!-- usage: r -->

[ggmsaview](https://github.com/GMOD/ggmsaview) gives an R Markdown or Quarto
page the same two forms. A chunk that prints `msaview_plot(w)` puts a ggplot2
figure on the page as a PNG, and a chunk that prints `w` puts the widget there,
with the viewer bundle inside it:

```r
library(ggmsaview)
w <- msaview(
  msa = "https://gmod.org/JBrowseMSA/demo/data/nlrp1.aln",
  tree = "https://gmod.org/JBrowseMSA/demo/data/nlrp1.nh",
  gff = "https://gmod.org/JBrowseMSA/demo/data/nlrp1-domains.gff"
)
w
ggplot2::ggsave("static_first-r.png", msaview_plot(w), width = 10, height = 4)
```

![](../media/static_first-r.png)

The whole family as a ggplot2 figure: the tree on the left, the Conservation and
Property conservation tracks over all 1666 columns, and each row's domains as
boxes, with the PAAD/DAPIN/Pyrin domain in Chimp, Human, Rhesus, Dog and
Hedgehog alone.

<!-- /usage -->

## 5. Or load it when the figure comes into view

On a page where most readers reach the figure, the script can start the download
as the box nears the viewport. This loop replaces the click handler of step 4:

```js
const nearby = new IntersectionObserver(
  entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        nearby.unobserve(entry.target)
        explore(entry.target)
      }
    }
  },
  { rootMargin: '200px' },
)
for (const box of document.querySelectorAll('.msa-embed')) {
  nearby.observe(box)
}
```

The capture script for this page's figures serves the page with this loop and
the box 2000 pixels down, and counts the requests for the bundle:

```text
scroll page at load: 0 bundle requests
scroll page after scrolling: 1 bundle requests
```

## 6. Measure both pages

`live.html` is the same page with the bundle in a deferred script tag and the
viewer mounted as the page loads. The build script serves the two pages gzipped,
the way unpkg and most hosts send them, and runs Lighthouse's mobile profile
over each, which loads the page on an emulated mid-range phone over a slow 4G
connection:

```bash
npx serve@14.2.6 -l 8123 . &
npx lighthouse@13.5.0 http://localhost:8123/ --only-categories=performance --throttling-method=devtools
npx lighthouse@13.5.0 http://localhost:8123/live --only-categories=performance --throttling-method=devtools
```

| Lighthouse, mobile       | `index.html`     | `live.html`           |
| ------------------------ | ---------------- | --------------------- |
| Bytes transferred        | 8 KB             | 455 KB                |
| Speed Index              | 1105 ms          | 4638 ms               |
| Largest contentful paint | 1442 ms, the SVG | 625 ms, the paragraph |
| Total blocking time      | 117 ms           | 667 ms                |
| Cumulative layout shift  | 0                | 0                     |

Speed Index measures when the visible page finishes painting, and it counts the
viewer's canvases. Largest contentful paint does not count a canvas, so on
`live.html` it records the paragraph under the box, which paints seconds before
the alignment. The times move by a few hundred milliseconds from run to run; the
byte counts do not.

## 7. Check the swap

The click should change what the box holds and nothing around it. The capture
script prints the box's height on both sides of the click:

```text
box before the click: 360 px
box after the click: 360 px
```

Lighthouse scored a layout shift of 0 for both pages, so neither the image
arriving nor the viewer mounting moved the text under the box. The SVG and the
live view open on the same columns: in both figures each row starts at column 1,
Horse is the one row with residues there, and the green PAAD/DAPIN/Pyrin cells
start at the same column in the same five rows.

## Reproduce it end to end

[`build_static_first.sh`](https://github.com/GMOD/JBrowseMSA/blob/main/docs/tutorials/scripts/build_static_first.sh)
runs the commands above in order:

1. It writes the props file naming the NLRP1 alignment, tree and domains by URL.
2. It draws the viewer's first frame from those props with
   `react-msaview-cli export-svg`, and prints the SVG's size beside the
   bundle's.
3. It writes `index.html`, which shows the SVG and loads the viewer on a click,
   and `live.html`, which loads the viewer as the page loads.
4. It serves both pages gzipped and runs Lighthouse's mobile profile over each,
   printing the bytes, the paint times, the blocking time and the layout shift.

It needs the tools under [Prerequisites](#prerequisites). Set `CHROME_PATH` when
Lighthouse does not find Chrome on its own.

```bash
curl -O https://raw.githubusercontent.com/GMOD/JBrowseMSA/main/docs/tutorials/scripts/build_static_first.sh
bash build_static_first.sh out/
```

The script writes the four files of the hosted folder into `out/`, and the
numbers quoted here are the ones it prints.

## See also

- [A protein family from a list of accessions](https://gmod.org/JBrowseMSA/tutorials/protein_family)
- [Embedding](https://gmod.org/JBrowseMSA/embedding)
- [Command-line tool](https://gmod.org/JBrowseMSA/cli)

## References

- Google Chrome team. Speed Index. _Chrome for Developers_,
  developer.chrome.com/docs/lighthouse/performance/speed-index.
- Walton P, Mihajlija M. Cumulative Layout Shift (CLS). _web.dev_,
  web.dev/articles/cls.
