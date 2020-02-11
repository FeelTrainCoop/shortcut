'use strict';

let path = require('path');
let webpack = require('webpack');
let baseConfig = require('./base');
let defaultSettings = require('./defaults');
let autoprefixer = require('autoprefixer');

let config = Object.assign({}, baseConfig, {
  entry: [
    'webpack-dev-server/client?http://127.0.0.1:' + defaultSettings.port,
    'webpack/hot/only-dev-server',
    './src/index'
  ],
  cache: true,
  devServer: {
    contentBase: './src/',
    historyApiFallback: true,
    hot: false,
    port: defaultSettings.port,
    publicPath: defaultSettings.publicPath,
    noInfo: false
  },
  devtool: 'eval-source-map',
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
		new webpack.LoaderOptionsPlugin({
			options: {
				context: __dirname,
				postcss: [
					autoprefixer
				]
			}
		})
  ],
  module: defaultSettings.getDefaultModules()
});

// Add needed loaders to the defaults here
config.module.rules.push({
  test: /\.(js|jsx)$/,
  loader: require.resolve('babel-loader'),
  exclude: [
    /node_modules[\\\/]react-waypoint/,
    /node_modules[\\\/]consolidated-events/
  ],
  //include: [].concat(
  //  config.additionalPaths,
  //  [ path.join(__dirname, '/../src') ]
  //),
  options: {
		cacheDirectory: true,
		plugins: ['react-hot-loader/babel'],
  }
});

module.exports = config;
