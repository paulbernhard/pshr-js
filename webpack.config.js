const path = require("path")

module.exports = {
  entry: "./src/index.js",
  output: {
    filename: "index.js",
    path: path.resolve(__dirname, "dist"),
    library: "@swrs/pshr-js",
    libraryTarget: "umd"
  },
  module: {
    rules: [
      { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" }
    ]
  },
  externals: {
    stimulus: {
      commonjs: "stimulus",
      commonjs2: "stimulus",
      amd: "stimulus"
    }
  }
}
