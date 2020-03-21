'use strict'

const eslintSupport = require('../core/eslint-support')

module.exports = {
  overrides: {
    files: eslintSupport.projectConfig.filePatterns.server,
    rules: {
      'global-require': 0
    }
  }
}
