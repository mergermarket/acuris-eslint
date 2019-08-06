'use strict'

/* eslint-disable global-require */

const eslintSupport = require('../core/eslint-support')

if (eslintSupport.hasEslintPluginImport) {
  const eslintPluginImport = require('eslint-plugin-import')

  const config = eslintSupport.mergeEslintConfigs(
    eslintPluginImport.configs.recommended,
    eslintPluginImport.configs.errors,
    eslintPluginImport.configs.warnings,
    eslintPluginImport.configs.electron,
    eslintPluginImport.configs.react,
    eslintPluginImport.configs['react-native'],
    {
      rules: {
        'import/named': 0,
        'import/default': 0,
        'import/namespace': 0,
        'import/no-named-as-default': 1,
        'import/no-named-as-default-member': 1,
        'import/no-deprecated': 0,
        'import/no-internal-modules': 0,
        'import/no-mutable-exports': 0,
        'import/no-cycle': 0,
        'import/no-commonjs': 0,
        'import/no-nodejs-modules': 0,
        'import/no-amd': 2,
        'import/first': 0,
        'import/group-exports': 0,
        'import/exports-last': 0,
        'import/imports-first': 0,
        'import/no-duplicates': 2,
        'import/newline-after-import': 1,
        'import/no-absolute-path': 2,
        'import/no-webpack-loader-syntax': 0,
        'import/no-relative-parent-imports': 0,
        'import/no-anonymous-default-export': 0,
        'import/no-self-import': 2,
        'import/no-unused-modules': 0,
        'import/no-useless-path-segments': [1, { noUselessIndex: false }],
        'import/no-unassigned-import': 0,
        'import/prefer-default-export': 0,
        'import/unambiguous': 0,
        'import/no-restricted-paths': 0,
        'import/max-dependencies': 0,
        'import/order': [
          0,
          {
            groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
            'newlines-between': 'never'
          }
        ],
        'import/extensions': 0,
        'import/no-extraneous-dependencies': [
          2,
          {
            devDependencies: true,
            optionalDependencies: false,
            peerDependencies: true
          }
        ],
        'import/no-unresolved': [
          2,
          {
            commonjs: true,
            caseSensitive: true
          }
        ],
        'import/no-namespace': 0
      }
    }
  )

  const extensions = new Set(config.settings['import/extensions'])
  for (const ext of ['.ts', '.tsx', '.d.ts', '.cjs', '.js', '.jsx', '.mjs']) {
    extensions.add(ext)
  }
  for (const ext of eslintSupport.extensions) {
    extensions.add(ext)
  }

  if (!config.settings) {
    config.settings = {}
  }
  config.settings['import/extensions'] = Array.from(extensions)

  const resolverSetting = config.settings['import/resolver']
  if (resolverSetting) {
    const nodeSetting = resolverSetting.node
    if (nodeSetting) {
      if (Array.isArray(nodeSetting.extensions)) {
        for (const ext of nodeSetting.extensions) {
          extensions.add(ext)
        }
      }
      nodeSetting.extensions = Array.from(extensions)
    }
  }

  module.exports = config
}
