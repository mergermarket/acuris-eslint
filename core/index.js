'use strict'

require('./node-modules')

require('./prettier-interface')

const eslintSupport = require('./eslint-support')

const { addEslintConfigPrettierRules } = require('eslint-plugin-quick-prettier/eslint-helpers')

exports.mergeEslintConfigs = require('./mergeEslintConfigs')

exports.eslintSupport = eslintSupport

exports.addEslintConfigPrettierRules = addEslintConfigPrettierRules
