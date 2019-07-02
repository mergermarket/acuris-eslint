'use strict'

/* eslint-disable global-require */
/* eslint-disable node/no-unpublished-require */

const { eslintSupport } = require('../core')

if (eslintSupport.hasEslintPluginJson) {
  module.exports = {
    plugins: ['json']
  }
}
