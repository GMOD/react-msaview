import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import nodePolyfills from 'rollup-plugin-node-polyfills'
import { nodeResolve } from '@rollup/plugin-node-resolve'

export default {
  input: 'dist/index.js',
  output: {
    dir: 'bundle',
    format: 'umd',
    name: 'ReactMSAView',
    globals: {
      react: 'React',
      'react-dom': 'ReactDOM',
    },
  },
  plugins: [
    nodePolyfills(),
    nodeResolve({ browser: true }),
    commonjs(),
    json(),
  ],
  external: ['react', 'react-dom', 'canvas'],
}
