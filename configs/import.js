'use strict'

/* eslint-disable global-require */

const { eslintSupport, mergeEslintConfigs } = require('../core')

if (eslintSupport.hasEslintPluginImport) {
  const eslintPluginImport = require('eslint-plugin-import')

  module.exports = mergeEslintConfigs(
    eslintPluginImport.configs.recommended,
    eslintPluginImport.configs.errors,
    eslintPluginImport.configs.warnings,
    eslintPluginImport.configs.electron,
    eslintPluginImport.configs.react,
    eslintPluginImport.configs['react-native']
  )

  const extensions = new Set(module.exports.settings['import/extensions'])
  for (const ext of ['.ts', '.tsx', '.d.ts', '.cjs', '.js', '.jsx', '.mjs']) {
    extensions.add(ext)
  }

  module.exports.settings['import/extensions'] = Array.from(extensions)
}
