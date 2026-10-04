import js from '@eslint/js';
import vue from 'eslint-plugin-vue';
import globals from 'globals';
import ts from 'typescript-eslint';

export default [
  { ignores: ['.worktrees/**', '.verification/**', 'dist/**', 'node_modules/**', 'test-results/**', 'playwright-report/**'] },
  js.configs.recommended,
  ...ts.configs.recommended.map(config => ({ ...config, files: ['**/*.ts', '**/*.vue'] })),
  ...vue.configs['flat/essential'],
  { languageOptions: { globals: { ...globals.browser, ...globals.node, $: 'readonly' } } },
  { files: ['**/*.vue'], languageOptions: { parserOptions: { parser: ts.parser } } },
  { files: ['**/*.ts', '**/*.vue'], rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  } },
  { files: ['src/**/*.ts', 'src/**/*.vue'], rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/ban-ts-comment': ['error', {
      'ts-expect-error': true, 'ts-ignore': true, 'ts-nocheck': true, 'ts-check': false,
    }],
  } },
  { files: ['tests/unit/**/*.js'], languageOptions: { globals: globals.vitest } },
];
