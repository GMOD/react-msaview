import commonjs from '@rollup/plugin-commonjs'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import terser from '@rollup/plugin-terser'
import nodePolyfills from 'rollup-plugin-polyfill-node'
import postcss from 'rollup-plugin-postcss'

export default {
  // Upstream issue: https://github.com/rollup/rollup/issues/4699
  onwarn: (warning, defaultHandler) => {
    if (
      warning.code === 'MODULE_LEVEL_DIRECTIVE' &&
      /"use (client|server)"/.test(warning.message)
    ) {
      return
    }

    defaultHandler(warning)
  },
  input: 'dist/index.js',
  output: {
    inlineDynamicImports: true,
    dir: 'bundle',
    format: 'umd',
    name: 'ReactMSAView',
    globals: {
      react: 'React',
      'react-dom': 'ReactDOM',
    },
  },
  plugins: [
    postcss({
      plugins: [],
    }),
    replace({
      'process.env.NODE_ENV': JSON.stringify('production'),
      preventAssignment: true,
    }),
    nodeResolve({ browser: true }),
    commonjs(),
    nodePolyfills(),
    terser(),
  ],
  external: ['react', 'react-dom', 'canvas'],
}
