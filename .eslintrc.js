console.log('env', process.env.NODE_ENV);
module.exports = {
  root: true,
  extends: [
    'plugin:vue/base',
    '@vue/airbnb',
  ],
  env: {
    node: true,
  },
  parserOptions: {
    parser: 'babel-eslint',
    sourceType: 'module',
    allowImportExportEverywhere: false,
    codeFrame: false,
    ecmaVersion: 2017,
  },
  rules: {
    'max-len': [2, { code: 125 }],
    'comma-dangle': [
      'error',
      'always-multiline',
    ],
    'import/prefer-default-export': 'off',
    'no-await-in-loop': 'off',
    'no-restricted-syntax': [
      'error',
      'LabeledStatement',
      'WithStatement',
    ],
    'no-console': process.env.NODE_ENV === 'production' ? 2 : 0,
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,
    'no-param-reassign': [
      'error',
      {
        props: false,
      },
    ],
    'no-return-assign': 'off',
    'no-mixed-operators': 'off',
    'import/no-cycle': 'off',
    'import/extensions': 'off',
    'import/order': 'off',
    'no-alert': 'off',
    'no-plusplus': 'off',
    'func-names': 'off',
    'linebreak-style': 'off',
    'object-curly-newline': 'off',
    'guard-for-in': 'off',
  },
};
