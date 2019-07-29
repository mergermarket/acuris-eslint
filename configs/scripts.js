'use strict'

const eslintSupport = require('../core/eslint-support')

module.exports = {
  overrides: [
    {
      files: ['scripts/**/*', 'webpack.config.*', 'webpack.*.config.*', 'jest-transformer.js'],
      rules: {
        'no-console': 0,
        'no-process-exit': 0,
        'global-require': 0,
        ...(eslintSupport.hasEslintPluginNode && { 'node/no-unpublished-require': 0 })
      },
      env: {
        browser: false,
        node: true
      }
    }
  ]
}
