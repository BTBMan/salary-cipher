import antfu from '@antfu/eslint-config'

export default antfu(
  {
    ignores: ['src/components/ui', 'src/contract-data', 'contracts'],
    vue: false,
    formatters: {
      css: true,
      html: true,
      markdown: 'prettier',
    },
    typescript: {
      overrides: {
        'perfectionist/sort-imports': [
          'error',
          {
            internalPattern: ['^~/.+', '^@/.+'],
            groups: [
              'type',
              ['type-parent', 'type-sibling', 'type-index', 'type-internal'],
              'builtin',
              'external',
              'internal',
              ['parent', 'sibling', 'index'],
              'side-effect',
              'ts-equals-import',
              'unknown',
            ],
            newlinesBetween: 'ignore',
            order: 'asc',
            type: 'natural',
          },
        ],
      },
    },
    react: {
      overrides: {
        'react-hooks-extra/no-direct-set-state-in-use-effect': 'off',
        'react-hooks-extra/no-direct-set-state-in-use-layout-effect': 'off',
        'react-dom/no-missing-button-type': 'off',
      },
    },
    nextjs: {
      overrides: {
        'next/no-img-element': 'off',
        'next/no-html-link-for-pages': 'off',
      },
    },
  },
  {
    rules: {
      'unused-imports/no-unused-vars': [
        'warn',
        { caughtErrors: 'none', argsIgnorePattern: '^_' },
      ],
      'node/prefer-global/process': 'off',
      'style/jsx-one-expression-per-line': 'off',
      'style/jsx-self-closing-comp': 'warn',
      'style/jsx-curly-spacing': [
        'error',
        { when: 'never', children: { when: 'never' } },
      ],
      'regexp/no-obscure-range': 'off',
      'regexp/no-unused-capturing-group': 'off',
      'regexp/no-super-linear-backtracking': 'off',
      'regexp/no-useless-quantifier': 'off',
      'jsdoc/check-param-names': 'off',
    },
  },
)
