'use strict'

/* eslint-disable node/no-missing-require */
/* eslint-disable global-require */

const { hasLocalPackage, hasPackage } = require('./node-modules')

const { isArray } = Array
const { assign: objectAssign, keys: objectKeys } = Object

const fs = require('fs')
const path = require('path')

const defaultReactVersion = '16.8.6'

class EslintSupport {
  constructor() {
    /** Is running in a continous integration server? */
    this.isCI = 'CI' in process.env

    /** @type {string} The react version supported by the project */
    this.reactVersion = getReactVersion()

    this.hasEslint = hasPackage('eslint')

    this.hasTypescript =
      hasLocalPackage('@typescript-eslint/parser') &&
      hasLocalPackage('@typescript-eslint/eslint-plugin') &&
      hasLocalPackage('typescript')

    this.hasEslintPluginCssModules = hasLocalPackage('eslint-plugin-css-modules')

    this.hasEslintPluginImport = hasLocalPackage('eslint-plugin-import')

    this.hasEslintPluginNode = hasLocalPackage('eslint-plugin-node')

    this.hasBabelEslintParser = hasLocalPackage('babel-eslint')

    this.hasEslintPluginReact = hasLocalPackage('eslint-plugin-react')

    this.hasEslintPluginJsxA11y = hasLocalPackage('eslint-plugin-jsx-a11y') && hasPackage('@babel/runtime')

    this.hasEslintPluginJest =
      hasPackage('eslint-plugin-jest') &&
      (hasPackage('jest') || fs.existsSync(path.join(process.cwd(), 'jest.config.js')))

    this.hasEslintPluginMocha = hasLocalPackage('eslint-plugin-mocha') && hasLocalPackage('mocha')

    this.hasEslintPluginChaiExpect = hasLocalPackage('eslint-plugin-chai-expect') && hasLocalPackage('chai')

    this.hasEslintPluginPromise = hasLocalPackage('eslint-plugin-promise')

    this.hasEslintPluginJson = hasLocalPackage('eslint-plugin-json')

    const extensions = ['.js', '.jsx', '.mjs', '.cjs']
    this.extensions = extensions

    if (this.hasTypescript) {
      extensions.push('.ts', '.tsx')
    }
    if (this.hasEslintPluginJson) {
      extensions.push('.json')
    }
  }

  /**
   * Merges multiple eslint configurations together or clones the given one.
   * @template T
   * @param  {...readonly T?} sources The sources to merge
   * @returns {Required<T>} A new merged configuration
   */
  mergeEslintConfigs(...sources) {
    let result = {}
    for (let i = 0; i < sources.length; ++i) {
      const source = sources[i]
      if (source !== null && source !== undefined) {
        if (typeof source !== 'object') {
          throw new TypeError(`eslint configuration ${i} must be an object but is a ${typeof source}`)
        }
        result = isArray(source)
          ? this.mergeEslintConfigs(result, ...source)
          : eslintConfigsDeepMerge(result, source, true)
      }
    }
    return result
  }
}

module.exports = new EslintSupport()

function getReactVersion() {
  let version = defaultReactVersion
  if (hasLocalPackage('react')) {
    try {
      // eslint-disable-next-line import/no-unresolved
      version = require('react/package.json').version
    } catch (_error) {}
  }
  return version
}

function eslintConfigsDeepMerge(target, src, combine, isRule) {
  /*
   * This code is inspired by deepmerge and eslint
   * (https://github.com/KyleAMathews/deepmerge)
   */
  const array = isArray(src) || isArray(target)
  let dst = (array && []) || {}

  if (array) {
    const resolvedTarget = target || []

    // src could be a string, so check for array
    if (isRule && isArray(src) && src.length > 1) {
      dst = dst.concat(src)
    } else {
      dst = dst.concat(resolvedTarget)
    }
    const resolvedSrc = typeof src === 'object' ? src : [src]
    const keys = objectKeys(resolvedSrc)
    for (let i = 0, len = keys.length; i !== len; ++i) {
      const e = resolvedSrc[i]
      if (dst[i] === undefined) {
        dst[i] = e
      } else if (typeof e === 'object') {
        if (isRule) {
          dst[i] = e
        } else {
          dst[i] = eslintConfigsDeepMerge(resolvedTarget[i], e, combine, isRule)
        }
      } else if (!combine) {
        dst[i] = e
      } else if (dst.indexOf(e) === -1) {
        dst.push(e)
      }
    }
  } else {
    if (target && typeof target === 'object') {
      objectAssign(dst, target)
    }
    const keys = objectKeys(src)
    for (let i = 0, len = keys.length; i !== len; ++i) {
      const key = keys[i]
      if (key === 'overrides') {
        const overrides = (target[key] || []).concat(src[key] || [])
        if (overrides.length !== 0) {
          dst[key] = overrides
        }
      } else if (isArray(src[key]) || isArray(target[key])) {
        dst[key] = eslintConfigsDeepMerge(target[key], src[key], key === 'plugins' || key === 'extends', isRule)
      } else if (typeof src[key] !== 'object' || !src[key] || key === 'exported' || key === 'astGlobals') {
        dst[key] = src[key]
      } else {
        dst[key] = eslintConfigsDeepMerge(target[key] || {}, src[key], combine, key === 'rules')
      }
    }
  }

  return dst
}
