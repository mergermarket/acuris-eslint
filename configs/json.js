'use strict'

/* eslint-disable global-require */
/* eslint-disable node/no-unpublished-require */

const eslintSupport = require('../core/eslint-support')

if (eslintSupport.hasEslintPluginJson) {
  module.exports = {
    plugins: ['json']
  }
}
