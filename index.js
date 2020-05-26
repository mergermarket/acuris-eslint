'use strict'

const eslintSupport = require('./core/eslint-support')

const defaultEnv = {
  es2020: true,
  node: true
}

const baseConfig = {
  overrides: [
    {
      files: [...eslintSupport.projectConfig.filePatterns.js, ...eslintSupport.projectConfig.filePatterns.mjs],
      env: defaultEnv
    }
  ]
}

const config = eslintSupport.mergeEslintConfigs(
  baseConfig,
  eslintSupport.eslintRequire('./conf/eslint-recommended'),
  require('./rules/import'),
  require('./rules/node'),
  require('./rules/json'),
  require('./rules/promise'),
  require('./rules/jsx-a11y'),
  require('./rules/typescript'),
  require('./rules/common'),
  require('./rules/scripts'),
  require('./rules/react'),
  require('./rules/server'),
  require('./rules/tests'),
  require('./rules/dist'),
  require('./rules/formatting')
)

module.exports = config
