#!/usr/bin/env node
/**
 * Builds packages/r-msaview/inst/js/msaview-core.js, the bundle msaviewr
 * evaluates in QuickJS to turn a viewer's props into the tables ggplot2 draws.
 * It runs the viewer's own model, so a figure takes every layer the widget
 * does, with no Node, V8 or browser at the R end.
 *
 * The model's few imports from the @jbrowse/core/util barrel resolve to a shim,
 * since the barrel pulls in React and MUI, and renderToSvg, which the model
 * imports lazily and an iife inlines along with react-dom, resolves to a stub.
 */
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { bannerFor, readLibVersion } from './sync-r-bundle.mjs'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const rJs = path.join(rootDir, 'packages/r-msaview/js')
const esbuild = createRequire(path.join(rootDir, 'packages/lib/package.json'))(
  'esbuild',
)

const shims = {
  '@jbrowse/core/util': path.join(rJs, 'coreUtilShim.ts'),
  '@jbrowse/core/util/io': path.join(rJs, 'coreUtilShim.ts'),
}

await esbuild
  .build({
    entryPoints: [path.join(rJs, 'bridge.ts')],
    outfile: path.join(rootDir, 'packages/r-msaview/inst/js/msaview-core.js'),
    bundle: true,
    nodePaths: [path.join(rootDir, 'packages/lib/node_modules')],
    format: 'iife',
    target: 'es2020',
    minify: true,
    legalComments: 'none',
    banner: { js: bannerFor(readLibVersion()) },
    define: { 'process.env.NODE_ENV': '"production"' },
    metafile: !!process.env.METAFILE,
    plugins: [
      {
        name: 'r-core-shims',
        setup(build) {
          build.onResolve(
            { filter: /^@jbrowse\/core\/util(\/io)?$/ },
            args => ({
              path: shims[args.path],
            }),
          )
          build.onResolve({ filter: /renderToSvg\.tsx$/ }, () => ({
            path: path.join(rJs, 'renderToSvgStub.ts'),
          }))
        },
      },
    ],
  })
  .then(result => {
    if (result.metafile) {
      console.log(
        esbuild.analyzeMetafileSync(result.metafile, { verbose: false }),
      )
    }
  })
