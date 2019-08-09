'use strict'

const eslintSupport = require('./core/eslint-support')

module.exports = eslintSupport.mergeEslintConfigs(
  require('eslint/conf/eslint-recommended'),
  require('./configs/import'),
  require('./configs/node'),
  require('./configs/json'),
  require('./configs/promise'),
  require('./configs/jsx-a11y'),
  require('./configs/typescript'),
  require('./configs/common'),
  require('./configs/scripts'),
  require('./configs/react'),
  require('./configs/server'),
  require('./configs/tests'),
  require('./configs/dist'),
  require('./configs/formatting')
)
