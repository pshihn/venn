/* eslint-disable */

import { terser } from 'rollup-plugin-terser';

const outFolder = 'bin';

function onwarn(warning) {
  if (warning.code === 'THIS_IS_UNDEFINED')
    return;
  console.error(warning.message);
}

export default [
  {
    input: 'bin/venny.js',
    output: {
      file: `${outFolder}/venny.esm.js`,
      format: 'esm'
    },
    onwarn,
    plugins: [
      terser({
        output: {
          comments: false
        }
      })
    ]
  },
  {
    input: 'bin/venny.js',
    output: {
      file: `${outFolder}/venny.iife.js`,
      format: 'iife',
      name: 'Venny'
    },
    onwarn,
    plugins: [
      terser({
        output: {
          comments: false
        }
      })
    ]
  }
];