'use strict'

const eslintSupport = require('../core/eslint-support')

if (eslintSupport.hasEslintPluginReact) {
  module.exports = eslintSupport.mergeEslintConfigs(require('eslint-plugin-react').configs.recommended, {
    env: {
      es6: true,
      browser: true
    },
    rules: {
      ...require('eslint-config-prettier/react').rules,
      'react/display-name': 0
    },
    settings: {
      react: {
        version: eslintSupport.reactVersion
      }
    }
  })
}
