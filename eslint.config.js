import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['node_modules/**', 'assets/vendor/**', 'playwright-report/**', 'test-results/**', 'dist/**'] },
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: globals.node },
    rules: { 'no-unused-vars': ['error', { argsIgnorePattern: '^_' }] },
  },
  { files: ['js/**/*.js'], languageOptions: { globals: globals.browser } },
  { files: ['tests/e2e/**/*.js'], languageOptions: { globals: { ...globals.node, ...globals.browser } } },
];
