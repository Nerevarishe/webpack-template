const path = require("path");
const HTMLWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCssAssetsWebpackPlugin = require("optimize-css-assets-webpack-plugin");
const TerserWebpackPlugin = require("terser-webpack-plugin");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");

// Check environment state: dev or prod
const isDev = process.env.NODE_ENV === "development";
const isProd = !isDev;

// Based on env, create custom names of files
const filename = (ext) => (isDev ? `[name].${ext}` : `[name].[hash].${ext}`);

// Dynamic CSS loaders
const cssLoaders = (extra) => {
  const loaders = [
    {
      loader: MiniCssExtractPlugin.loader,
      options: {
        hmr: isDev,
        reloadAll: true,
      },
    },
    "css-loader",
    "postcss-loader"
  ];

  if (extra) {
    loaders.push(extra);
  }

  return loaders;
};

// Optimizations based on env state (minimizing js and css)
const optimization = () => {
  const config = {
    splitChunks: {
      chunks: "all",
    },
  };
  if (isProd) {
    config.minimizer = [
      new OptimizeCssAssetsWebpackPlugin(),
      new TerserWebpackPlugin(),
    ];
  }
  return config;
};


// Customize babels presets
const babelOptions = (preset) => {
  const opts = {
    presets: ["@babel/preset-env"],
    plugins: ["@babel/plugin-proposal-class-properties"],
  };

  if (preset) {
    opts.presets.push(preset);
  }

  return opts;
};

// Dynamic js loaders based on env state (adding eslint in dev)
const jsLoaders = () => {
  const loaders = [
    {
      loader: "babel-loader",
      options: babelOptions(),
    },
  ];

  if (isDev) {
    loaders.push("eslint-loader");
  }

  return loaders;
};


module.exports = {
  // Set context dir of app
  context: path.resolve(__dirname, "src"),
  // Set default env state
  mode: "development",
  // Configure entry points of app
  entry: {
    main: ["@babel/polyfill", "./index.jsx"],
    analytics: "./analytics.ts",
  },
  // Configure output dir
  output: {
    filename: filename("js"),
    path: path.resolve(__dirname, "dist"),
  },
  resolve: {
    // Configure extensions:
    // extensions: [".js", ".json", ".png"],

    // Configure aliases to app parts
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  // Optimization production build
  optimization: optimization(),
  // Configure dev server
  devServer: {
    port: 3000,
    hot: isDev,
  },
  // Generate source-maps in dev mode
  devtool: isDev ? "source-map" : "",
  // Configure plugins
  plugins: [
    new HTMLWebpackPlugin({
      template: "./index.html",
      minify: {
        // minimize in prod
        collapseWhitespace: isProd,
      },
    }),
    new CleanWebpackPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, "src/favicon.ico"),
          to: path.resolve(__dirname, "dist"),
        },
      ],
    }),
    new MiniCssExtractPlugin({
      filename: filename("css"),
    }),
  ],
  module: {
    rules: [
      // CSS
      {
        test: /\.css$/,
        use: cssLoaders(),
      },
      // SASS
      {
        test: /\.(scss|sass)$/,
        use: cssLoaders("sass-loader"),
      },
      // Image files
      {
        test: /\.(png|jpg|svg|gif)$/,
        use: ["file-loader"],
      },
      // Font files
      {
        test: /\.(ttf|woff|woff2|eot)$/,
        use: ["file-loader"],
      },
      // Babel configuration
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: jsLoaders(),
      },
    ],
  },
};
