'use strict'

/* eslint-disable global-require */
/* eslint-disable node/no-unpublished-require */

const eslintHelpers = require('../eslint-helpers')

if (eslintHelpers.hasEslintPluginCssModules) {
  const eslintPluginCssModules = require('eslint-plugin-css-modules')

  module.exports = eslintHelpers.mergeEslintConfigs(eslintPluginCssModules.configs.recommended, {
    'css-modules/no-unused-class': 1,
    'css-modules/no-undef-class': 1
  })
}
