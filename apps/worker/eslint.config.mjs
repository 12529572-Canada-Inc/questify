import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import eslintPluginImport from 'eslint-plugin-import';

export default [
  {
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.eslint.json',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      import: eslintPluginImport,
    },
    rules: {
      // Formatting / stylistic rules
      semi: ['error', 'always'],
      quotes: ['error', 'single', { avoidEscape: true }],
      indent: ['error', 2, { SwitchCase: 1 }],
      'comma-dangle': ['error', 'always-multiline'],
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],
      'eol-last': ['error', 'always'],
      'max-len': [
        'warn',
        {
          code: 100,
          ignoreComments: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
        },
      ],
      'no-trailing-spaces': ['error'],

      // TS-specific rules
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'off',

      // Import rules (ESM/NodeNext style)
      'import/extensions': [
        'error',
        'ignorePackages',
        {
          ts: 'never',   // ❌ forbid ".ts"
          tsx: 'never',
          js: 'always',  // ✅ require ".js"
          jsx: 'always',
        },
      ],

      // NEW: let ESLint autofix missing/incorrect extensions
      'import/no-unresolved': 'error',
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
        },
        node: {
          extensions: ['.js', '.ts'],
        },
      },
    },
  },
];
