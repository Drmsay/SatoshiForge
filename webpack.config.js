const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WebpackInlinePlugin = require('./webpack-inline-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: './src/main.ts',
    mode: isProduction ? 'production' : 'development',
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'bundle.js',
      clean: true,
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
      // Polyfills for Node.js modules to work in browser
      fallback: {
        "crypto": require.resolve("crypto-browserify"),
        "stream": require.resolve("stream-browserify"),
        "buffer": require.resolve("buffer"),
        "util": require.resolve("util"),
        "assert": require.resolve("assert"),
        "url": require.resolve("url"),
        "fs": false, // File system not available in browser
        "path": require.resolve("path-browserify"),
      }
    },
    plugins: [
      // Provide global Buffer and process for Node.js compatibility
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
        process: 'process/browser',
      }),
      // Define global as globalThis for browser compatibility
      new webpack.DefinePlugin({
        'global': 'globalThis',
      }),
      // Generate HTML from template
      new HtmlWebpackPlugin({
        template: './index.html',
        inject: 'body',
        minify: isProduction ? {
          removeComments: true,
          collapseWhitespace: true,
          removeRedundantAttributes: true,
        } : false,
      }),
      // Inline all assets into single HTML file (production only)
      ...(isProduction ? [new WebpackInlinePlugin()] : []),
    ].filter(Boolean),
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: {
            loader: 'ts-loader',
            options: {
              transpileOnly: false,
            },
          },
          exclude: /node_modules/,
        },
        {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader'],
        },
        {
          test: /\.(png|jpg|jpeg|gif|svg)$/i,
          type: 'asset/inline', // Inline images as base64
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/inline', // Inline fonts as base64
        },
      ],
    },
    devServer: {
      static: {
        directory: path.join(__dirname, 'dist'),
      },
      port: 3000,
      open: true,
      hot: true,
    },
    optimization: {
      minimize: isProduction,
    },
  };
};

