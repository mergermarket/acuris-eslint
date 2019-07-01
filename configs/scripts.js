'use strict'

const eslintHelpers = require('../eslint-helpers')

module.exports = {
  overrides: [
    {
      files: ['scripts/**/*', 'webpack.config.*', 'webpack.*.config.*', 'jest-transformer.js'],
      rules: {
        'no-console': 0,
        'no-process-exit': 0,
        'global-require': 0,
        ...(eslintHelpers.hasEslintPluginNode && { 'node/no-unpublished-require': 0 })
      },
      env: {
        browser: false,
        node: true
      }
    }
  ]
}
