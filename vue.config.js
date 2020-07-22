const WebpackPwaManifest = require('webpack-pwa-manifest');
const path = require('path');

module.exports = {
  devServer: {
    overlay: {
      warnings: true,
      errors: true,
    },
  },
  lintOnSave: process.env.NODE_ENV !== 'production',
  configureWebpack: {
    plugins: [
      new WebpackPwaManifest({
        name: 'Foreign Field',
        background_color: '#f2faff',
        display: "standalone",
        fingerprints: false,
        crossorigin: 'use-credentials', //can be null, use-credentials or anonymous
        ios: {
          'apple-mobile-web-app-title': 'Foreign Field',
          'apple-mobile-web-app-status-bar-style': 'default',
        },
        icons: [
          {
            src: path.resolve('public/assets/icon.png'),
            destination: 'assets',
            sizes: [20, 29, 40, 60, 76, 83.5], // multiple sizes
            ios: true,
          },
          {
            src: path.resolve('public/assets/icon.png'),
            destination: 'assets',
            sizes: ['828x1792', '1125x2436', '750x1334', '1242x2208', '640x1136', '1536x2048', '1668x2224', '2048x2732'],
            ios: 'startup',
          },
        ]
      }),
    ]
  }
};
