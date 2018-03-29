import pkg from './package.json';
import nodeResolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';

const banner = `/**
 * ${pkg.name} - ${pkg.description}
 * @version v${pkg.version}
 * @link ${pkg.homepage}
 * @license ${pkg.license}
 **/
`;

export default {
  input: 'lib/index.js',
  output: {
    banner,
    file: 'dist/fetch.js',
    format: 'umd',
    indent: '  ',
    name: 'Fetch'
  },
  plugins: [
    nodeResolve(),
    babel({
      exclude: 'node_modules/**'
    })
  ]
};
