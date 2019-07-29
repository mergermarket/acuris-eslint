'use strict'

/* eslint-disable global-require */
/* eslint-disable node/no-unpublished-require */

const eslintSupport = require('../core/eslint-support')

if (eslintSupport.hasEslintPluginCssModules) {
  const eslintPluginCssModules = require('eslint-plugin-css-modules')

  module.exports = eslintSupport.mergeEslintConfigs(eslintPluginCssModules.configs.recommended, {
    'css-modules/no-unused-class': 1,
    'css-modules/no-undef-class': 1
  })
}
