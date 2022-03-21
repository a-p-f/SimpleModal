// rollup.config.js
import babel from 'rollup-plugin-babel';
import { terser } from "rollup-plugin-terser";

const pkg = require('./package.json');
const banner = `/*!
  SimpleModal.js
  version: ${pkg.version}
  author: Alex Fischer
  homepage: https://github.com/a-p-f/SimpleModal
*/`;

export default [
  {
    input: 'src/SimpleModal.js',
    output: {
      banner,
      file: `dist/SimpleModal.min.js`,
      format: 'iife',
      name: 'SimpleModal',
      sourcemap: false,
    },
    plugins: [
      babel(), 
      terser({})
    ],
  },
  {
    input: 'src/SimpleModal.js',
    output: {
      banner,
      file: 'dist/SimpleModal.js',
      format: 'iife',
      name: 'SimpleModal',
      sourcemap: true,
    },
    plugins: [
      babel(),
    ],
  },
];