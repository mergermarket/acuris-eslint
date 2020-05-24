'use strict'

const eslintSupport = require('../core/eslint-support')

if (eslintSupport.hasEslintPluginJson) {
  module.exports = {
    overrides: [
      {
        files: '*.json',
        plugins: ['json'],
        rules: {
          'json/*': [2, { allowComments: true }]
        }
      }
    ]
  }
}
