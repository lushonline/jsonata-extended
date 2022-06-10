module.exports = {
  extends: ['airbnb-base', 'plugin:prettier/recommended', 'prettier'],
  env: {
    es6: true,
    node: true,
  },
  rules: {
    'max-len': [
      'warn',
      {
        code: 100,
        tabWidth: 2,
        ignoreComments: true,
        ignoreTrailingComments: true,
        ignoreUrls: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        ignoreRegExpLiterals: true,
      },
    ],
    'no-underscore-dangle': ['error', { allowAfterThis: true }],
  },
  parser: '@babel/eslint-parser',
  parserOptions: {
    requireConfigFile: false,
  },
};
