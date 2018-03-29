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

const [ filename ] = pkg.main.split( '/' ).reverse();
const name = filename.replace( '.js', '' );

export default {
  input: pkg.module,
  output: {
    banner,
    file: pkg.main,
    format: 'umd',
    indent: '  ',
    name
  },
  plugins: [
    nodeResolve(),
    babel({
      exclude: 'node_modules/**'
    })
  ]
};
