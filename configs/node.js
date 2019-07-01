'use strict'

/* eslint-disable global-require */
/* eslint-disable node/no-unpublished-require */

const eslintHelpers = require('../eslint-helpers')
const common = require('./common')

if (eslintHelpers.hasEslintPluginNode) {
  const configs = require('eslint-plugin-node').configs
  const nodeScript = configs['recommended-script']
  const nodeModule = configs['recommended-module']

  const rules = {
    'node/exports-style': [0, 'module.exports'],
    'node/no-deprecated-api': 2,
    'node/no-missing-require': 2,
    'node/no-unpublished-bin': 2,
    'node/no-unsupported-features/es-syntax': 0,
    'node/shebang': 0
  }

  module.exports = {
    plugins: ['node'],
    rules: {
      ...nodeScript.rules,
      ...rules
    },
    overrides: [
      {
        files: ['*.mjs'],
        globals: nodeModule.globals,
        parserOptions: {
          ...common.parserOptions,
          ...nodeModule.parserOptions
        },
        rules: {
          ...nodeModule.rules,
          ...rules
        }
      }
    ]
  }
}
