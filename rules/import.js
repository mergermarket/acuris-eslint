'use strict'

const eslintSupport = require('../core/eslint-support')

if (eslintSupport.hasEslintPluginImport) {
  const extensions = getExtensions()

  const settings = {
    'import/core-modules': ['electron', 'aws-sdk'],
    'import/extensions': extensions,
    'import/resolver': {
      node: {
        extensions
      }
    }
  }

  if (eslintSupport.hasEslintImportResolverParcel) {
    settings['import/resolver'].parcel = { extensions }
  }

  if (eslintSupport.hasTypescript) {
    settings['import/parsers'] = {
      ...settings['import/parsers'],
      '@typescript-eslint/parser': eslintSupport.projectConfig.tsExtensions
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
  const set = new Set()
  for (const ext of eslintSupport.projectConfig.jsonExtensions) {
    set.add(ext)
  }
  for (const ext of eslintSupport.projectConfig.jsExtensions) {
    set.add(ext)
  }
  if (eslintSupport.hasTypescript) {
    for (const ext of eslintSupport.projectConfig.tsExtensions) {
      set.add(ext)
    }
  }
  return Array.from(set)
}
