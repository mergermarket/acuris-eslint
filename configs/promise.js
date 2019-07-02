'use strict'

/* eslint-disable global-require */
/* eslint-disable node/no-unpublished-require */

const { eslintSupport, mergeEslintConfigs } = require('../core')

if (eslintSupport.hasEslintPluginPromise) {
  const eslintPluginPromiseConfig = require('eslint-plugin-promise').configs

  module.exports = mergeEslintConfigs(eslintPluginPromiseConfig.recommended, {
    rules: {
      'promise/always-return': 0,
      'promise/no-return-wrap': 1,
      'promise/param-names': 0,
      'promise/catch-or-return': 1,
      'promise/no-native': 0,
      'promise/no-nesting': 0,
      'promise/no-promise-in-callback': 0,
      'promise/no-callback-in-promise': 0,
      'promise/avoid-new': 0,
      'promise/no-new-statics': 2,
      'promise/no-return-in-finally': 2,
      'promise/valid-params': 1
    }
  })
}
