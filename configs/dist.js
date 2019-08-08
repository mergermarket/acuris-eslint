'use strict'

const eslintSupport = require('../core/eslint-support')

const distRules = {
  'no-empty': 0,
  'no-shadow': 0,
  'global-require': 0,
  'no-func-assign': 0,
  'no-unused-expressions': 0,
  'no-sequences': 0
}

if (eslintSupport.hasEslintPluginNode) {
  distRules['node/exports-style'] = 0
  distRules['node/no-extraneous-require'] = 0
}

module.exports = {
  overrides: [
    {
      files: ['**/dist/**/*', '**/_dist/**/*', '**/out/**/*', '**/_out/**/*'],
      rules: distRules
    }
  ]
}
