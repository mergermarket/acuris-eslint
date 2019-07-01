'use strict'

/* eslint-disable global-require */
/* eslint-disable node/no-unpublished-require */

const eslintHelpers = require('../eslint-helpers')

if (eslintHelpers.hasEslintPluginJson) {
  module.exports = {
    plugins: ['json']
  }
}
