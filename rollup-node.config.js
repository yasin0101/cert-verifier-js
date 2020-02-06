import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import replace from 'rollup-plugin-re';
import globals from 'rollup-plugin-node-globals';
import { terser } from 'rollup-plugin-terser';

export default {
  input: 'src/index.js',
  output: [
    {
      file: 'dist/verifier-node.js',
      format: 'cjs',
      name: 'Verifier'
    }
  ],
  plugins: [
    resolve({
      extensions: [ '.js', '.json' ],
      preferBuiltins: true
    }),
    // https://github.com/rollup/rollup-plugin-commonjs/issues/166
    // fix issue with jsonld
    replace({
      patterns: [
        {
          match: /jsonld.js/,
          test: 'global = window;',
          replace: ''
        },
        {
          match: /jsonld.js/,
          test: 'global = self;',
          replace: ''
        },
        {
          match: /jsonld.js/,
          test: 'global = $;',
          replace: ''
        },
        // fix jsonld|jsonldjs is not defined
        {
          match: /jsonld.js/,
          test: 'if(typeof jsonld === \'undefined\') {',
          replace: 'if(typeof window.jsonld === \'undefined\') {'
        },
        {
          match: /jsonld.js/,
          test: 'jsonld = jsonldjs = factory;',
          replace: 'window.jsonld = window.jsonldjs = factory;'
        }
      ]

    }),
    commonjs({
      namedExports: {
        'debug': ['debug'],
        'bitcoinjs-lib': ['bitcoin'],
        'jsonld': ['jsonld']
      }
    }),
    json(),
    globals(),
    terser()
  ]
};