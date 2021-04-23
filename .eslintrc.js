module.exports = {
  root: true,
  env: {
    node: true,
    es6: true,
  },
  parserOptions: {
    ecmaVersion: 2020,
  },
  extends: ['eslint:recommended', 'prettier', 'plugin:prettier/recommended'],
  rules: {
    indent: ['error', 2],
    quotes: ['error', 'single', { avoidEscape: true }],
  },
};
