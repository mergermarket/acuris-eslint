'use strict'

const eslintSupport = require('../core/eslint-support')
const common = require('./common')

if (eslintSupport.hasEslintPluginNode) {
  const configs = require('eslint-plugin-node').configs
  const nodeScript = configs['recommended-script']
  const nodeModule = configs['recommended-module']

  const rules = {
    'no-process-exit': 2,
    'node/no-deprecated-api': 2,
    'node/no-extraneous-require': 0,
    'node/no-missing-require': 0,
    'node/no-unpublished-bin': 2,
    'node/no-unpublished-require': 2,
    'node/no-unsupported-features/es-builtins': 2,
    'node/no-unsupported-features/es-syntax': 0,
    'node/no-unsupported-features/node-builtins': 2,
    'node/process-exit-as-throw': 2,
    'node/shebang': 0,
    'node/no-extraneous-import': 0,
    'node/no-missing-import': 0,
    'node/no-unpublished-import': 0,
    'node/exports-style': [0, 'module.exports']
  }

  module.exports = {
    plugins: ['node'],
    rules: {
      ...nodeScript.rules,
      ...rules
    },
    globals: nodeScript.globals,
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
