'use strict'

const eslintSupport = require('../core/eslint-support')

const typescriptExtensions = ['.ts', '.tsx', '.d.ts']

if (eslintSupport.hasEslintPluginImport) {
  const extensions = getExtensions()

  const settings = {
    'import/core-modules': ['electron', 'aws-sdk'],
    'import/extensions': extensions,
    'import/resolver': {
      node: { extensions }
    }
  }

  if (eslintSupport.hasEslintImportResolverParcel) {
    settings['import/resolver'].parcel = { extensions }
  }

  if (eslintSupport.hasTypescript) {
    settings['import/parsers'] = {
      ...settings['import/parsers'],
      '@typescript-eslint/parser': typescriptExtensions
    }
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
      'import/newline-after-import': 0,
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
    settings
  }

  module.exports = config
}

function getExtensions() {
  const result = new Set(typescriptExtensions)

  for (const ext of ['.cjs', '.js', '.jsx', '.mjs', '.web.js', '.ios.js', '.android.js']) {
    result.add(ext)
  }

  for (const ext of eslintSupport.extensions) {
    result.add(ext)
  }

  return Array.from(result)
}
