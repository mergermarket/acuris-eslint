'use strict'

const eslintHelpers = require('./eslint-helpers')

module.exports = eslintHelpers.addEslintConfigPrettierRules(
  eslintHelpers.mergeEslintConfigs(
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
