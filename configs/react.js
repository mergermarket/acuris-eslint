'use strict'

/* eslint-disable global-require */
/* eslint-disable node/no-unpublished-require */

const eslintHelpers = require('../eslint-helpers')

if (eslintHelpers.hasEslintPluginReact) {
  module.exports = eslintHelpers.mergeEslintConfigs(require('eslint-plugin-react').configs.recommended, {
    env: {
      es6: true,
      browser: true
    },
    rules: {
      'react/display-name': 0
    },
    settings: {
      react: {
        version: eslintHelpers.reactVersion
      }
    }
  })
}
