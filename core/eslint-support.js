'use strict'

/* eslint-disable node/no-missing-require */
/* eslint-disable global-require */

const { eslintRequire, hasLocalPackage, hasPackage, projectConfig } = require('./node-modules')
const fs = require('fs')
const path = require('path')

const { isArray } = Array
const { assign: objectAssign, keys: objectKeys } = Object

const defaultReactVersion = '16.13.1'

exports.projectConfig = projectConfig

/** Is running in a continous integration server? */
exports.isCI = 'CI' in process.env

/** @type {string} The react version supported by the project */
exports.reactVersion = projectConfig.reactVersion || getReactVersion()

exports.hasEslint = hasPackage('eslint')

exports.hasTypescript =
  hasLocalPackage('@typescript-eslint/parser') &&
  hasLocalPackage('@typescript-eslint/eslint-plugin') &&
  hasLocalPackage('typescript')

exports.tsConfigPath = projectConfig.tsConfigPath || findFileUp('tsconfig.json') || undefined

exports.hasEslintImportResolverParcel = hasLocalPackage('eslint-import-resolver-parcel')

exports.hasEslintPluginCssModules = hasLocalPackage('eslint-plugin-css-modules')

exports.hasEslintPluginImport = hasLocalPackage('eslint-plugin-import')

exports.hasEslintPluginNode = hasLocalPackage('eslint-plugin-node')

exports.hasEslintPluginReact = hasLocalPackage('eslint-plugin-react')

exports.hasEslintPluginJsxA11y = hasLocalPackage('eslint-plugin-jsx-a11y')

exports.hasEslintPluginJest =
  hasLocalPackage('eslint-plugin-jest') && (hasPackage('jest') || fs.existsSync('jest.config.js'))

exports.hasEslintPluginMocha = hasLocalPackage('eslint-plugin-mocha') && hasLocalPackage('mocha')

exports.hasEslintPluginChaiExpect = hasLocalPackage('eslint-plugin-chai-expect') && hasLocalPackage('chai')

exports.hasEslintPluginPromise = hasLocalPackage('eslint-plugin-promise')

exports.hasEslintPluginJson = hasLocalPackage('eslint-plugin-json')

const extensions = ['.js', '.jsx', '.mjs', '.cjs']

if (this.hasTypescript) {
  extensions.push('.ts', '.tsx')
}
if (this.hasEslintPluginJson) {
  extensions.push('.json')
}

exports.extensions = extensions

/**
 * Merges multiple eslint configurations together or clones the given one.
 * @template T
 * @param  {...readonly T?} sources The sources to merge
 * @returns {Required<T>} A new merged configuration
 */
function mergeEslintConfigs(...sources) {
  let result = {}
  for (let i = 0; i < sources.length; ++i) {
    const source = sources[i]
    if (source !== null && source !== undefined) {
      if (typeof source !== 'object') {
        throw new TypeError(`eslint configuration ${i} must be an object but is a ${typeof source}`)
      }
      result = isArray(source) ? mergeEslintConfigs(result, ...source) : eslintConfigsDeepMerge(result, source, true)
    }
  }
  return result
}

exports.eslintRequire = eslintRequire

exports.mergeEslintConfigs = mergeEslintConfigs

exports.getMergedOverridesRules = getMergedOverridesRules

function getMergedOverridesRules(...configs) {
  const result = {}
  for (const config of configs) {
    const overrides = config.overrides
    if (isArray(overrides)) {
      for (const override of overrides) {
        const rules = override && override.rules
        if (typeof rules === 'object') {
          objectAssign(result, rules)
        }
      }
    }
  }
  return result
}

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

function findFileUp(filename) {
  let result
  let p = process.cwd()
  for (;;) {
    const resolvedPath = path.resolve(p, filename)
    try {
      if (fs.statSync(resolvedPath).isFile()) {
        return resolvedPath
      }
    } catch (_error) {}
    const parent = path.dirname(p) || ''
    if (parent.length === p.length) {
      break
    }
    p = parent
  }
  return result
}
