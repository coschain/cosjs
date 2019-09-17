const TerserPlugin = require('terser-webpack-plugin'); // eslint-disable-line
const webpack = require('webpack'); // eslint-disable-line
const path = require('path'); // eslint-disable-line

const env = process.env.NODE_ENV;   // eslint-disable-line
const filename = 'cosjs';      // eslint-disable-line
const library = 'Cos';          // eslint-disable-line
const config = {                    // eslint-disable-line
  entry: [
    './lib/index.js',
  ],
  module: {
    rules:  [
      {
        test: /\.js$/,
        loaders: ['babel-loader'],
        exclude: /node_modules/,
      },
      {
        test: /\.json$/,
        loader: 'json',
      },
    ],
  },
  devtool: 'cheap-module-source-map',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: filename + '.js',       // eslint-disable-line
    library: library,                 // eslint-disable-line
    libraryTarget: 'umd',
    umdNamedDefine: true,
  },
  plugins: [
    new webpack.BannerPlugin({ banner: ' /* eslint-disable */ ', raw: true, entryOnly: true }),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(env),
    }),
  ],
};


if (env === 'production') {
  config.output.filename = filename + '.min.js'; // eslint-disable-line
  config.optimization = {
    minimizer: [
      new TerserPlugin({
        cache: true,
        parallel: true,
        sourceMap: true, // Must be set to true if using source-maps in production
        terserOptions: {
          // https://github.com/webpack-contrib/terser-webpack-plugin#terseroptions
        }
      }),
    ],
  };
}


module.exports = config;
