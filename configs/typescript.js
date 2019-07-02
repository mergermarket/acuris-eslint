'use strict'

/* eslint-disable global-require */
/* eslint-disable node/no-unpublished-require */

const { eslintSupport, mergeEslintConfigs } = require('../core')

const common = require('./common')

if (eslintSupport.hasTypescript) {
  module.exports = {
    overrides: [
      {
        files: ['*.ts', '*.tsx'],
        parser: '@typescript-eslint/parser',
        parserOptions: common.parserOptions,
        plugins: ['@typescript-eslint'],
        rules: {
          ...require('@typescript-eslint/eslint-plugin').configs.recommended.rules,

          ...require('@typescript-eslint/eslint-plugin').configs['eslint-recommended'].overrides[0].rules,

          ...(eslintSupport.hasEslintPluginNode && {
            'node/no-unsupported-features/es-syntax': 0
          }),

          ...(eslintSupport.hasEslintPluginImport && {
            // TODO: These rules may be useful but they are too slow on big projects. Disable for typescript, typescript should cover enough.
            'import/namespace': 0,
            'import/named': 0,
            'import/default': 0,
            'import/no-unresolved': 0,
            'import/no-named-as-default': 0,
            'import/no-named-as-default-member': 0
            //'import/no-duplicates': 0
          }),

          'no-dupe-class-members': 0, // TODO: this would be a useful thing, but at the moment is buggy with overloads.
          '@typescript-eslint/adjacent-overload-signatures': 1,
          '@typescript-eslint/array-type': 1,
          '@typescript-eslint/ban-types': 1,
          '@typescript-eslint/camelcase': 0,
          '@typescript-eslint/indent': 0,
          '@typescript-eslint/class-name-casing': 0,
          '@typescript-eslint/explicit-function-return-type': 0,
          '@typescript-eslint/explicit-member-accessibility': 1,
          '@typescript-eslint/interface-name-prefix': 0,
          '@typescript-eslint/no-angle-bracket-type-assertion': 0,
          '@typescript-eslint/no-array-constructor': common.rules['no-array-constructor'],
          '@typescript-eslint/no-empty-interface': 0,
          '@typescript-eslint/no-explicit-any': 0,
          '@typescript-eslint/no-inferrable-types': 0,
          '@typescript-eslint/no-misused-new': 2,
          '@typescript-eslint/no-namespace': 0,
          '@typescript-eslint/no-non-null-assertion': 0,
          '@typescript-eslint/no-object-literal-type-assertion': 1,
          '@typescript-eslint/no-parameter-properties': 0,
          '@typescript-eslint/no-triple-slash-reference': 0,
          '@typescript-eslint/type-annotation-spacing': 1,
          '@typescript-eslint/member-delimiter-style': [
            1,
            {
              multiline: {
                delimiter: 'none',
                requireLast: false
              },
              singleline: {
                delimiter: 'semi',
                requireLast: false
              }
            }
          ],
          '@typescript-eslint/no-unused-vars': common.rules['no-unused-vars'],
          '@typescript-eslint/no-use-before-define': common.rules['no-use-before-define'],
          '@typescript-eslint/no-var-requires': 1,
          '@typescript-eslint/prefer-interface': 1,
          '@typescript-eslint/prefer-namespace-keyword': 1
        }
      },
      {
        files: ['*.d.ts'],
        rules: {
          '@typescript-eslint/explicit-member-accessibility': 0
        }
      }
    ]
  }

  if (eslintSupport.hasEslintPluginImport) {
    module.exports = mergeEslintConfigs(module.exports, require('eslint-plugin-import').configs.typescript)
  }
}
