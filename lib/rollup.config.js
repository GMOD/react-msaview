import commonjs from '@rollup/plugin-commonjs'
import replace from '@rollup/plugin-replace'
import json from '@rollup/plugin-json'
import nodePolyfills from 'rollup-plugin-polyfill-node'
import terser from '@rollup/plugin-terser'
import { nodeResolve } from '@rollup/plugin-node-resolve'

export default {
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
    nodeResolve({ browser: true }),
    commonjs(),
    json(),
    nodePolyfills(),
    replace({
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    terser(),
  ],
  external: ['react', 'react-dom', 'canvas'],
}
