'use strict'

const {
  hasPackage,
  hasLocalPackage,
  isInstalledGlobally,
  addNodeRequirePath,
  addNodeRequirePathRecursive
} = require('./node-modules')

const eslintSupport = require('./eslint-support')

const { addEslintConfigPrettierRules } = require('eslint-plugin-quick-prettier/eslint-helpers')

exports.prettierInterface = require('./prettier-interface')

exports.mergeEslintConfigs = require('./mergeEslintConfigs')

exports.isInstalledGlobally = isInstalledGlobally

exports.eslintSupport = eslintSupport

exports.addEslintConfigPrettierRules = addEslintConfigPrettierRules

exports.hasPackage = hasPackage

exports.hasLocalPackage = hasLocalPackage

exports.addNodeRequirePath = addNodeRequirePath

exports.addNodeRequirePathRecursive = addNodeRequirePathRecursive
