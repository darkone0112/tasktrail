// webpack.config.js
require("dotenv").config();

const path = require("path");
const webpack = require("webpack");
const { VueLoaderPlugin } = require("vue-loader");

module.exports = (env, argv) => {
	// this is the entry file for webpack
	const { mode } = argv;
	const isProduction = mode === "production";
	return {
		entry: "./src/main.js",
		mode: isProduction ? "production" : "development",

		// compiled/built output file
		output: {
			path: path.resolve(__dirname, "public/js/"),
			filename: "index.js",
			// this must be same as Express static use.
			// Check ./app.js
			publicPath: "/js/"
		},
		plugins: [
			// make sure to include the plugin!
			new VueLoaderPlugin(),
			new webpack.DefinePlugin({
				__VUE_OPTIONS_API__: true,
				__VUE_PROD_DEVTOOLS__: false,
				__VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false
			})
		],
		module: {
			rules: [
				{
					test: /\.vue$/,
					loader: "vue-loader"
				},
				{
					test: /\.pug$/,
					loader: "pug-plain-loader"
				},
				{
					test: /\.s[ac]ss$/i,
					use: ["style-loader", "css-loader", "sass-loader"]
				},
				{
					test: /\.css$/,
					use: ["style-loader", "css-loader"]
				}
			]
		},
		devServer: {
			static: "./",
			compress: true,
			port: 8080,
			proxy: [
				{
					// Redirect requests to the Express server on port 3000.
					context: ["/"],
					target: `http://localhost:${process.env.PORT || 3000}`
				}
			]
		},
		resolve: {
			alias: {
				// we have to use Vue Es Modules compatible build
				vue$: "vue/dist/vue.esm-bundler.js"
			}
		},
		performance: {
			hints: false,
			maxEntrypointSize: 512000,
			maxAssetSize: 512000
		},
		experiments: {
			topLevelAwait: true
		}
	};
};
