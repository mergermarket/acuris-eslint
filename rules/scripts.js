'use strict'

const eslintSupport = require('../core/eslint-support')

const scriptRules = {
  'no-console': 0,
  'no-process-exit': 0,
  'global-require': 0
}

const binRules = { ...scriptRules }

if (eslintSupport.hasEslintPluginNode) {
  scriptRules['node/no-unpublished-require'] = 0
  scriptRules['node/no-extraneous-import'] = 0
  scriptRules['node/no-extraneous-require'] = 0
  binRules['node/no-missing-require'] = 0
}

if (eslintSupport.hasEslintPluginImport) {
  binRules['import/no-unresolved'] = 0
}

module.exports = {
  overrides: [
    {
      files: eslintSupport.projectConfig.filePatterns.scripts,
      rules: scriptRules,
      env: {
        browser: false,
        node: true
      }
    },
    {
      files: eslintSupport.projectConfig.filePatterns.bin,
      rules: binRules
    }
  ]
}
