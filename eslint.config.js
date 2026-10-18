import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['node_modules/**', '.backups/**', '.preview/**', 'dist/**'] },
  js.configs.recommended,
  {
    files: ['js/**/*.js'],
    languageOptions: { sourceType: 'script', globals: { ...globals.browser } },
    rules: { 'no-var': 'error', 'prefer-const': 'warn', eqeqeq: ['error', 'always'] },
  },
  {
    files: ['js/jai-catalog.js', 'js/site-config.js', 'js/config-global.js'],
    languageOptions: { sourceType: 'module', globals: { ...globals.browser } },
  },
  {
    files: ['functions/**/*.js', 'scripts/**/*.mjs', 'eslint.config.js'],
    languageOptions: {
      sourceType: 'module',
      globals: { ...globals.node, Request: 'readonly', Response: 'readonly' },
    },
    rules: { 'no-var': 'error', 'prefer-const': 'warn', eqeqeq: ['error', 'always'] },
  },
];
