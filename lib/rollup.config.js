import { nodeResolve } from '@rollup/plugin-node-resolve'

export default {
  input: 'dist/index.js',
  output: {
    dir: 'dist',
    format: 'umd',
  },
  plugins: [nodeResolve()],
  external: ['react', 'react-dom'],
}
