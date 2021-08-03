const path = require('path');
const webpack = require("webpack");
const HtmlWebPackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const SWPrecacheWebpackPlugin = require("sw-precache-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const OUTPUT_DIR = 'dist';
const entry = {
    'home': './src/pages/user/home.ts',
    'admin': './src/pages/sys/admin.ts',
    'base': './src/pages/base/base.ts',
};

const optimization = {
    splitChunks: {
        cacheGroups: {
            vendor: {
                test: /node_modules/,
                chunks: "all",
                name: "vendor",
                priority: 10,
                enforce: true
            }
        }
    },
    minimizer: [
        new UglifyJsPlugin({
            uglifyOptions: {
                output: {
                    comments: false
                }
            }
        })
    ]
};

module.exports = (env, argv) => {
    const type =
        argv.mode === 'production' ? {
            pathToDist: '../dist',
            mode: 'production',
            minify: {
                removeComments: true,
                collapseWhitespace: true,
                removeScriptTypeAttributes: true,
                removeStyleLinkTypeAttributes: true,
                minifyCSS: true
            }
        } : {
                pathToDist: 'dist',
                mode: 'development',
                minify: false
            };

    const entryHtmlPlugins = Object.keys(entry).map(entryName => {
        return new HtmlWebPackPlugin({
            filename: `${entryName}.html`,
            template: `sources/${entryName}.html`,
            chunks: [entryName],
            minify: type.minify,
            mode: type.mode,
            // inlineSource: '.(js|css)$',
        })
    });

    const output = {
        path: path.resolve(__dirname, './dist'),
        filename: 'vendor/js/[name].[chunkhash].bundle.js'
    };

    return {
        devtool: devProdOption('source-map', 'none', argv),
        entry: entry,
        output: output,
        module: {
            rules: [
                {
                    test : /\.ts$/,
                    loader : "ts-loader",
                    options : { //This can be useful when certain types definitions have errors that are not fatal to your application.
                        reportFiles : ['src/**/*.{ts,tsx}', '!src.skip.ts']
                    },
                    exclude: ['/node_modules']
                },
                {
                    // HTML
                    test: /\.html$/,
                    use: [
                        {
                            loader: "html-loader",
                            options: {
                                minimize: argv.mode === 'development' ? false : true
                            }
                        }
                    ]
                },
                {   // CSS SASS SCSS
                    test: /\.(css|sass|scss)$/,
                    use: [
                        argv.mode === 'development' ? 'style-loader' : MiniCssExtractPlugin.loader,
                        {
                            loader: 'css-loader',
                            options: {
                                importLoaders: 2,
                                sourceMap: true
                            }
                        },
                        {
                            loader: 'postcss-loader',
                            options: {
                                sourceMap: true,
                                config: {
                                    path: './config/',
                                },
                            },
                        },
                        {
                            loader: 'sass-loader',
                            options: {
                                sourceMap: true
                            }
                        },
                        {
                            loader: 'sass-resources-loader',
                            options: {
                                resources: ['./sources/scss/main.scss']
                            },
                        }
                    ]
                },
                {
                    // IMAGES
                    test: /\.(jpe?g|png|gif|svg)$/i,
                    loader: "file-loader",
                    options: {
                        useRelativePath: true,
                        name: '[name].[ext]',
                    }
                },
            ]
        },
        optimization: argv.mode === 'production' ? optimization : {},
        plugins: [
            prodPlugin(
                new CleanWebpackPlugin({
                    verbose: true
                }), argv
            ),
            prodPlugin(
                new MiniCssExtractPlugin({
                    filename: "vendor/css/[name].[hash].css"
                }), argv
            ),
            prodPlugin(
                new SWPrecacheWebpackPlugin({
                    cacheId: 'gt',
                    dontCacheBustUrlsMatching: /\.\w{8}\./,
                    filename: 'sw.js',
                    minify: false,
                    navigateFallback: PUBLIC_PATH + 'index.html',
                    stripPrefix: OUTPUT_DIR,
                    staticFileGlobs: [
                        `${OUTPUT_DIR}/assets/manifest.json`,
                        `${OUTPUT_DIR}/favicon.ico`,
                        `${OUTPUT_DIR}/vendor/js/*.js`,
                        `${OUTPUT_DIR}/vendor/css/*.css`
                    ],
                }),
                argv
            ),
            prodPlugin(
                new CopyWebpackPlugin([
                    { from: 'sources/assets/', to: 'assets/' }
                ]), argv
            ),
            new webpack.DefinePlugin({
                PRODUCTION: JSON.stringify(true)
            }),
        ]
            .concat(entryHtmlPlugins)
    }
};
const devProdOption =(dev, prod, argv) =>{
    return argv.mode === 'development' ? dev : prod;
}
const prodPlugin = (plugin, argv) =>{
    return argv.mode === 'production' ? plugin : () => { };
}
const devPlugin = (plugin, argv) =>{
    return argv.mode === 'development' ? plugin : () => { };
}
 



// module.exports = {
//     mode : process.env.NODE_ENV,
//     devtool : "source-map",
//     entry : "./src/index.tsx",
//     output : {
//         path : path.join(__dirname,'../dist'),
//         filename : 'main.js',
//         publicPath : '/'
//     },
//     resolve : {
//         extensions : ['.ts','.tsx', '.js'],
//         alias : {
//             '@' : path.resolve(__dirname, '../src/')
//         }
//     },
//     module : {
//         rules : [
//             {
//                 test : /\.ts$/,
//                 loader : "ts-loader",
//                 options : { //This can be useful when certain types definitions have errors that are not fatal to your application.
//                     reportFiles : ['src/**/*.{ts,tsx}', '!src.skip.ts']
//                 },
//                 exclude: ['/node_modules']
//             },
//             {
//                 test : /\.css$/,
//                 use : [MiniCssExtractPlugin.loader, "css-loader"]
//             },
//             {
//                 test : /\.(png|jpg|gif|svg)$/,
//                 loader : "file-loader",
//                 options : "assets/img/[name][ext]?[hash]"
//             }
//         ]
//     },
//     plugins : [
//         new HtmlWebpackPlugin({
//             filename : "./src/index.html",
//             template : "./src/index.html",
//             hash : true
//         }),
//         new MiniCssExtractPlugin({
//             filename : "[name].css",
//             chunkFilename : "[id].css"
//         })
//     ],
//     devServer : {
//         host : "localhost",
//         port : 8080,
//     }
// }