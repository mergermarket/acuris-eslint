'use strict'

const eslintSupport = require('../core/eslint-support')

const distEnv = {
  node: true,
  browser: true
}

const distRules = {
  'no-console': 0,
  'no-empty': 0,
  'no-shadow': 0,
  'global-require': 0,
  'no-func-assign': 0,
  'no-unused-expressions': 0,
  'no-sequences': 0,
  'no-prototype-builtins': 0,
  'no-multi-assign': 0,
  'no-void': 0
}

if (eslintSupport.hasEslintPluginNode) {
  distRules['node/exports-style'] = 0
  distRules['node/no-extraneous-require'] = 0
}

const emscriptenDistRules = {
  ...distRules,
  'no-unused-vars': 0,
  eqeqeq: 0,
  'prefer-spread': 0,
  'block-scoped-var': 0,
  'prefer-rest-params': 0,
  'no-var': 0,
  'no-cond-assign': 0,
  'prefer-const': 0,
  'no-use-before-define': 0,
  'object-shorthand': 0,
  'no-redeclare': 0,
  'no-useless-catch': 0,
  'node/no-deprecated-api': 0,
  'no-useless-escape': 0,
  'no-undef': 0,
  'consistent-return': 0,
  'no-restricted-syntax': 0,
  'no-throw-literal': 0,
  'no-alert': 0,
  'no-lonely-if': 0,
  'no-process-exit': 0,
  'no-global-assign': 0,
  'no-buffer-constructor': 0,
  'no-lone-blocks': 0,
  'no-constant-condition': 0,
  'promise/catch-or-return': 0
}

module.exports = {
  overrides: [
    {
      files: eslintSupport.projectConfig.filePatterns.dist,
      rules: distRules,
      env: distEnv
    },
    {
      files: eslintSupport.projectConfig.filePatterns.distWasm,
      rules: emscriptenDistRules,
      env: distEnv
    }
  ]
}
