'use strict'

const eslintSupport = require('../core/eslint-support')

if (eslintSupport.hasEslintPluginJson) {
  module.exports = {
    plugins: ['json'],
    rules: {
      'json/*': [2, { allowComments: true }]
    }
  }
}
