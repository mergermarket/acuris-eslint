'use strict'

const eslintSupport = require('../core/eslint-support')

const scriptFiles = [
  '**/scripts/**/*',
  '**/bin/**/*',
  '**/.bin/**/*',
  '**/build/**/*',
  '.eslintrc.js',
  'webpack.config.*',
  'webpack.*.config.*',
  'jest-*.*',
  '**/testUtils/**/*',
  '**/__mocks__/**/*',
  'Gruntfile.js',
  'gulpfile.js',
  'Gulpfile.js',
  '**/gulp/**/*',
  '**/grunt/**/*'
]
const scriptRules = {
  'no-console': 0,
  'no-process-exit': 0,
  'global-require': 0
}

const binFiles = ['**/bin/**/*', '**/.bin/**/*']
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
      files: scriptFiles,
      rules: scriptRules,
      env: {
        browser: false,
        node: true
      }
    },
    {
      files: binFiles,
      rules: binRules
    }
  ]
}
