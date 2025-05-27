const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/webview/index.tsx',
  output: {
    path: path.resolve(__dirname, 'media'),
    filename: 'webview.js',
    publicPath: '',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: 'ts-loader',
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  devtool: 'source-map',
};
