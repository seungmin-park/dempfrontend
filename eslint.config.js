import js from '@eslint/js';
import vue from 'eslint-plugin-vue';
import globals from 'globals';
import ts from 'typescript-eslint';

export default [
  { ignores: ['dist/**', 'node_modules/**', 'test-results/**', 'playwright-report/**'] },
  js.configs.recommended,
  ...ts.configs.recommended.map(config => ({ ...config, files: ['**/*.ts', '**/*.vue'] })),
  ...vue.configs['flat/essential'],
  { languageOptions: { globals: { ...globals.browser, ...globals.node, $: 'readonly' } } },
  { files: ['**/*.vue'], languageOptions: { parserOptions: { parser: ts.parser } } },
  { files: ['**/*.ts', '**/*.vue'], rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  } },
  { files: ['tests/unit/**/*.js'], languageOptions: { globals: globals.vitest } },
];
