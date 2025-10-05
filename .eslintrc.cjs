// Root ESLint config for monorepo
module.exports = {
  root: true,
  env: {
    es2021: true,
    node: true,
    browser: true,
    jest: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  settings: {
    react: { version: 'detect' },
  },
  // Start with no enforced rules to avoid blocking CI; can be tightened later
  rules: {},
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      parser: '@typescript-eslint/parser',
      rules: {},
    },
  ],
};


