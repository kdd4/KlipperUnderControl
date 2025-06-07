module.exports = {
  env: { browser: true, es2021: true },
  extends: ['eslint:recommended', 'plugin:preact/recommended'],
  parserOptions: { ecmaVersion: 12, sourceType: 'module' },
  rules: { 'no-console': 'warn', 'prettier/prettier': 'error' },
  settings: { react: { pragma: 'h', fragment: 'Fragment' } }
};
