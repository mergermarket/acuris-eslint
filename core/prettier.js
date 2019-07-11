'use strict'

/* eslint-disable global-require */

const fs = require('fs')
const path = require('path')

require('./node-modules')

let _prettier
let _prettierConfig

/**
 * require('prettier')
 * Throws an error if not available.
 *
 * @returns {typeof import('prettier')}
 */
function getPrettier() {
  return _prettier || (_prettier = requirePrettier())
}

exports.getPrettier = getPrettier

/**
 * require('prettier').
 * Returns null if prettier is not available.
 *
 * @returns {null | typeof import('prettier')}
 */
function tryGetPrettier() {
  if (_prettierConfig === undefined) {
    try {
      return getPrettier()
    } catch (_error) {
      _prettierConfig = null
    }
  }
  return _prettierConfig
}

exports.tryGetPrettier = tryGetPrettier

/**
 * Gets the active prettier configuration.
 *
 * @returns {typeof import('eslint-plugin-quick-prettier/eslint-helpers').getPrettierConfig}
 */
function getPrettierConfig() {
  return _prettierConfig || (_prettierConfig = loadPrettierConfig())
}

exports.getPrettierConfig = getPrettierConfig

function tryPrettify(
  source,
  options = {
    throwOnErrors: false
  }
) {
  const prettier = tryGetPrettier()
  if (!prettier) {
    return source
  }
  try {
    return getPrettier().format(source, { ...getPrettierConfig(), ...options })
  } catch (error) {
    if (!options || options.throwOnErrors) {
      throw error
    }
  }
  return source
}

exports.tryPrettify = tryPrettify

function requirePrettier() {
  try {
    return require('eslint-plugin-quick-prettier/eslint-helpers').getPrettier()
  } catch (_error) {}
  return require('prettier')
}

function loadPrettierConfig() {
  const defaultConfig = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../.prettierrc')))
  const prettier = tryGetPrettier()
  if (prettier) {
    try {
      return {
        ...defaultConfig,
        ...prettier.resolveConfig.sync(exports.baseFolder, {
          editorconfig: true,
          useCache: true
        })
      }
    } catch (_error) {}
  }
  return defaultConfig
}
