// rollup.config.js
import babel from 'rollup-plugin-babel';
import livereload from 'rollup-plugin-livereload'
import serve from 'rollup-plugin-serve'
// import { nodeResolve } from '@rollup/plugin-node-resolve';
// import commonjs from '@rollup/plugin-commonjs';

export default [
  {
    input: 'src/SimpleModal.js',
    output: {
      file: 'tests/SimpleModal.js',
      format: 'iife',
      name: 'SimpleModal',
      sourcemap: true,
    },
    plugins: [
      babel(),
    	// nodeResolve(), 
    	// commonjs(), 
    	serve({open: true, port: 10003}), 
    	livereload({watch: 'dev'})
    ],
  },
];