'use strict'

const eslintSupport = require('../core/eslint-support')

if (eslintSupport.hasEslintPluginImport) {
  const extensions = new Set([
    '.ts',
    '.tsx',
    '.d.ts',
    '.cjs',
    '.js',
    '.jsx',
    '.mjs',
    '.web.js',
    '.ios.js',
    '.android.js'
  ])
  for (const ext of eslintSupport.extensions) {
    extensions.add(ext)
  }

  const config = {
    plugins: ['import'],
    rules: {
      'import/no-unresolved': [2, { commonjs: true, caseSensitive: true }],
      'import/export': 2,
      'import/no-named-as-default': 1,
      'import/no-named-as-default-member': 1,
      'import/no-duplicates': 1,
      'import/no-amd': 2,
      'import/newline-after-import': 1,
      'import/no-absolute-path': 2,
      'import/no-self-import': 2,
      'import/no-useless-path-segments': [1, { noUselessIndex: false }],
      'import/order': [
        0,
        { groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'], 'newlines-between': 'never' }
      ],
      'import/no-extraneous-dependencies': [
        0,
        { devDependencies: true, optionalDependencies: false, peerDependencies: true }
      ]
    },
    settings: {
      'import/core-modules': ['electron', 'aws-sdk'],
      'import/extensions': extensions,
      'import/resolver': { node: { extensions } }
    }
  }

  module.exports = config
}
