'use strict'

const {
  hasPackage,
  hasLocalPackage,
  isInstalledGlobally,
  addNodeRequirePath,
  addNodeRequirePathRecursive
} = require('./node-modules')

const { getPrettierConfig, tryGetPrettier, getPrettier } = require('./prettier')

const eslintSupport = require('./eslint-support')

const { addEslintConfigPrettierRules } = require('eslint-plugin-quick-prettier/eslint-helpers')

const mergeEslintConfigs = require('./mergeEslintConfigs')

exports.isInstalledGlobally = isInstalledGlobally

exports.eslintSupport = eslintSupport

exports.mergeEslintConfigs = mergeEslintConfigs

exports.addEslintConfigPrettierRules = addEslintConfigPrettierRules

exports.getPrettierConfig = getPrettierConfig

exports.tryGetPrettier = tryGetPrettier

exports.getPrettier = getPrettier

exports.hasPackage = hasPackage

exports.hasLocalPackage = hasLocalPackage

exports.addNodeRequirePath = addNodeRequirePath

exports.addNodeRequirePathRecursive = addNodeRequirePathRecursive
