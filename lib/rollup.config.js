import commonjs from '@rollup/plugin-commonjs'

import json from '@rollup/plugin-json'
import builtins from 'rollup-plugin-node-builtins'

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
  plugins: [nodeResolve(), commonjs(), json(), builtins()],
  external: ['react', 'react-dom', 'canvas'],
}
