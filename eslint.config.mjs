import { fixupConfigRules } from '@eslint/compat'
import globals from 'globals'
import tsParser from '@typescript-eslint/parser'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

export default [
  {
    ignores: [
      '**/coverage',
      '**/node_modules/',
      '**/dist/',
      '**/bundle/',
      '**/.eslintrc.js',
      'lib/output-version.js',
    ],
  },
  ...fixupConfigRules(
    compat.extends(
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:@typescript-eslint/recommended-type-checked',
      'plugin:@typescript-eslint/stylistic-type-checked',
      'plugin:unicorn/recommended',
      'plugin:react/recommended',
      'plugin:react-hooks/recommended',
      'plugin:prettier/recommended',
    ),
  ),
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
      },

      parser: tsParser,
      ecmaVersion: 5,
      sourceType: 'commonjs',

      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },

        project: './tsconfig.json',
      },
    },

    settings: {
      react: {
        version: 'detect',
      },
    },

    rules: {
      'no-redeclare': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-base-to-string': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          ignoreRestSiblings: true,
          caughtErrors: 'none',
        },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/restrict-plus-operands': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      'no-unexpected-multiline': 'error',
      'unicorn/no-new-array': 'off',
      'unicorn/prefer-type-error': 'off',
      'unicorn/prefer-node-protocol': 'off',
      'unicorn/no-unreadable-array-destructuring': 'off',
      'unicorn/no-abusive-eslint-disable': 'off',
      'unicorn/no-array-callback-reference': 'off',
      'unicorn/number-literal-case': 'off',
      'unicorn/prefer-add-event-listener': 'off',
      'unicorn/prefer-top-level-await': 'off',
      'unicorn/consistent-function-scoping': 'off',
      'unicorn/no-await-expression-member': 'off',
      'unicorn/no-lonely-if': 'off',
      'unicorn/consistent-destructuring': 'off',
      'unicorn/prefer-module': 'off',
      'unicorn/prefer-optional-catch-binding': 'off',
      'unicorn/no-useless-undefined': 'off',
      'unicorn/no-null': 'off',
      'unicorn/no-nested-ternary': 'off',
      'unicorn/filename-case': 'off',
      'unicorn/catch-error-name': 'off',
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/prefer-code-point': 'off',
      'unicorn/numeric-separators-style': 'off',
      'unicorn/no-array-for-each': 'off',
      'unicorn/prefer-spread': 'off',
      'unicorn/explicit-length-check': 'off',
      'unicorn/prefer-regexp-test': 'off',
      'unicorn/relative-url-style': 'off',
      'unicorn/prefer-math-trunc': 'off',
      'unicorn/prefer-query-selector': 'off',
      'unicorn/switch-case-braces': 'off',
      'unicorn/prefer-switch': 'off',
      'unicorn/better-regex': 'off',
      'unicorn/no-for-loop': 'off',
      'unicorn/escape-case': 'off',
      'unicorn/prefer-number-properties': 'off',
      curly: 'error',
      'no-use-before-define': 'off',
      'no-global-assign': 'warn',

      'no-console': [
        'warn',
        {
          allow: ['error', 'warn'],
        },
      ],

      'no-debugger': 'warn',
      'no-undef': 'error',
      'react/no-danger': 'warn',
      'react/prop-types': 'off',
      'react/destructuring-assignment': 'error',
      'react/no-unused-prop-types': 'error',
      'react/no-unused-state': 'error',
      'react/prefer-stateless-function': 'error',

      'spaced-comment': [
        'error',
        'always',
        {
          markers: ['/'],
        },
      ],
    },
  },
]
