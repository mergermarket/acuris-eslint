'use strict'

const { addEslintConfigPrettierRules, mergeEslintConfigs } = require('./core')

module.exports = addEslintConfigPrettierRules(
  mergeEslintConfigs(
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
    require('./configs/tests')
  )
)
