'use strict'

const eslintSupport = require('../core/eslint-support')

const scriptRules = {
  'no-console': 0,
  'no-process-exit': 0,
  'global-require': 0,
  ...(eslintSupport.hasEslintPluginNode && {
    'node/no-unpublished-require': 0,
    'node/no-extraneous-import': 0,
    'node/no-extraneous-require': 0
  })
}

const binRules = { ...scriptRules }

if (eslintSupport.hasEslintPluginNode) {
  binRules['node/no-missing-require'] = 0
}

if (eslintSupport.hasEslintPluginImport) {
  binRules['import/no-unresolved'] = 0
}

module.exports = {
  overrides: [
    {
      files: [
        '**/scripts/**/*',
        '**/build/**/*',
        'webpack.config.*',
        'webpack.*.config.*',
        'jest-*.*',
        '**/testUtils/**/*',
        '**/__mocks__/**/*'
      ],
      rules: scriptRules,
      env: {
        browser: false,
        node: true
      }
    },
    {
      files: ['**/bin/**/*', '**/.bin/**/*'],
      rules: binRules
    }
  ]
}
