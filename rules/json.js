'use strict'

const eslintSupport = require('../core/eslint-support')

if (eslintSupport.hasEslintPluginJson && eslintSupport.projectConfig.jsonExtensions.length) {
  module.exports = {
    overrides: [
      {
        files: eslintSupport.projectConfig.filePatterns.json,
        plugins: eslintSupport.projectConfig.jsonExtensions,
        rules: {
          'json/*': [2, { allowComments: true }]
        }
      }
    ]
  }
}
