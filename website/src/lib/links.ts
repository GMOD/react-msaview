// Every page the site routes to. The header bar, the docs sidebar and the home
// page's index all read this list, and [doc].astro builds one page per `docs`
// entry from the markdown file its `source` names.
const base = import.meta.env.BASE_URL

export interface SiteLink {
  label: string
  href: string
}

export interface DocPage extends SiteLink {
  slug: string
  body: string
  /** markdown file the page renders, relative to the repo root */
  source: string
}

export const app: SiteLink = {
  label: 'Standalone app',
  href: `${base}/demo/`,
}

export const tutorials: SiteLink = {
  label: 'Tutorials',
  href: `${base}/tutorials`,
}

export const examples: SiteLink = {
  label: 'Examples',
  href: `${base}/examples`,
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
    'docs/r-package.md',
    'R package',
    'ggmsaview: the viewer as an htmlwidget and as ggplot2 figures, with ape, Biostrings, ggtree, treeio and Shiny interop.',
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
