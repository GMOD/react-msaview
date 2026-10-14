// Every page the site routes to. The header bar, the docs sidebar and the home
// page's index all read this list, and [doc].astro builds one page per `docs`
// entry from the markdown file its `source` names.
const base = import.meta.env.BASE_URL

export interface SiteLink {
  label: string
  href: string
  body: string
}

export interface DocPage extends SiteLink {
  slug: string
  /** markdown file the page renders, relative to the repo root */
  source: string
}

export const app: SiteLink = {
  label: 'Standalone app',
  href: `${base}/demo/`,
  body: 'Open your own files: a FASTA, Stockholm, Clustal, A3M or EMF alignment, a Newick tree, and GFF3 or InterProScan JSON annotations, from your computer or a URL.',
}

export const tutorials: SiteLink = {
  label: 'Tutorials',
  href: `${base}/tutorials`,
  body: 'Data preparation outside the viewer, from sequences to an alignment, a tree and annotations, each walkthrough ending on a link that opens the result. The index doubles as the gallery.',
}

export const examples: SiteLink = {
  label: 'Examples',
  href: `${base}/examples`,
  body: 'The embedding guide as running code: one page per usage pattern, each rendering the viewer beside the source that produced it.',
}

function doc(slug: string, source: string, label: string, body: string) {
  return { slug, source, label, body, href: `${base}/${slug}` }
}

export const guide = doc(
  'guide',
  'docs/user_guide.md',
  'User guide',
  'Navigation, color schemes, tracks, exporting, and sharing a link to a view.',
)

export const docs: DocPage[] = [
  guide,
  doc(
    'layers',
    'docs/layers.md',
    'Layers',
    'Highlights, data tracks and structure mappings you compute, carried in the snapshot for the viewer to draw.',
  ),
  doc(
    'embedding',
    'USAGE.md',
    'Embedding',
    'The React component: props, the model API, and the UMD script tag.',
  ),
  doc(
    'r-package',
    'packages/r-msaview/README.md',
    'R package',
    'The msaviewr htmlwidget, with ape, Biostrings, ggtree, treeio and Shiny interop.',
  ),
  doc(
    'python-package',
    'packages/python/README.md',
    'Python package',
    'The msaview-widget anywidget for JupyterLab, Notebook, VS Code and Colab, with Biopython, numpy and pandas interop.',
  ),
  doc(
    'cli',
    'packages/cli/README.md',
    'CLI',
    'react-msaview-cli builds domain and exon GFFs from InterPro, InterProScan or RefSeq, and exports an SVG with no browser.',
  ),
]
