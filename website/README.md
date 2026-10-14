# website

The documentation site for JBrowseMSA, a small [Astro](https://astro.build) site
(plain Astro + React, like the jbrowse-components website). The site renders the
repo's docs and embeds the **live viewer** as a React island on the homepage.

```sh
pnpm --filter website dev       # local dev server
pnpm --filter website build     # static build → dist/
pnpm --filter website preview   # preview the build
# or from the repo root: pnpm build:site
```

## How it's wired

| Page                                  | What it is                                                                                      |
| ------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `index.astro`                         | Landing page: a live `MSAViewer` (`src/components/Viewer.tsx`) and an index of every page       |
| `[doc].astro`                         | One page per `docs` entry in `src/lib/links.ts`, rendering the markdown file its `source` names |
| `tutorials/index.astro`               | The gallery: one card per entry in `src/lib/tutorials.ts`, under its category's heading         |
| `tutorials/[slug].astro`              | One page per `docs/tutorials/*.md` that `tutorials.ts` lists                                    |
| `tutorials/structure_link.astro`      | A live alignment beside its Mol\* structure (`StructureLinkedViewer.tsx`)                       |
| `tutorials/jbrowse_integration.astro` | The connected JBrowse sessions; hand-written, since its content is URLs built in TypeScript     |
| `examples.astro`                      | `packages/examples` as a React island (`ExamplesApp`)                                           |

Every page but the home page and the examples renders through
`layouts/DocsLayout.astro`, which puts the docs sidebar (`DocsSidebar.astro`) on
the left. The sidebar lists the `docs` pages, then the tutorials, one heading
per category. A markdown page with four or more `##` sections also gets an "On
this page" column on the right, built from `getHeadings()`.

Rendering the repo's markdown keeps the docs in one place. Small plugins in
`astro.config.mjs` do the rest:

- a remark plugin rewrites every markdown image to `/{base}/media/<file>`, early
  enough that Astro does not also emit an optimized copy nothing asks for
- `wrapFigures` wraps a screenshot and the paragraph under it into a `<figure>`
- `rehypeHeadingIds` gives every heading an id, and `headingAnchors` adds the
  hover `#` link to it

`scripts/sync-assets.mjs` copies `docs/media/*` into `public/media/` (run
automatically by `dev`/`build`); `public/media` is git-ignored.

## Adding a page

- **A markdown doc:** add an entry to `docs` in `src/lib/links.ts` and its path
  to the glob in `[doc].astro`, which throws at build time on an entry whose
  file it does not glob.
- **A tutorial:** add the markdown to `docs/tutorials/` and an entry to
  `src/lib/tutorials.ts`, with its `category` and a short `navLabel` for the
  sidebar.
- **A hand-written page:** a `.astro` file in `src/pages/` that wraps its
  content in `DocsLayout`.

The header bar links Docs, Tutorials, Examples and the standalone app, from a
list in `Base.astro`. An entry in `links.ts` adds a row to the sidebar and the
home page index.

## Deployment

The site is served under `base: '/JBrowseMSA'` (`astro.config.mjs`), so every
absolute link in a page or a markdown doc starts with that prefix. The root
[README](../README.md#deployment) covers how a push to `main` builds and
publishes it.
