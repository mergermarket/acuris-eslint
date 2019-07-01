'use strict'

/* eslint-disable node/no-missing-require */
/* eslint-disable global-require */

const Module = require('module')
const path = require('path')
const fs = require('fs')

const { isArray, from: arrayFrom } = Array
const { keys: objectKeys, assign: objectAssign, defineProperty } = Object
const { existsSync } = fs

const _hasLocalPackageCache = new Map()
const _hasPackageCache = new Map()

const _globalPathsArray = Module.globalPaths || []
const _globalPathsSet = new Set(_globalPathsArray)
let _oldNodeModulePaths = null

module.exports.baseFolder = process.cwd()

module.exports.isGlobalPath = isGlobalPath

module.exports.hasLocalPackage = hasLocalPackage

module.exports.hasPackage = hasPackage

module.exports.addNodeRequirePath = addNodeRequirePath

module.exports.defineLazyProperty = defineLazyProperty

module.exports.mergeEslintConfigs = mergeEslintConfigs

function mergeEslintConfigs(...sources) {
  let result = {}
  for (const source of sources) {
    result = deepmerge(result, source, true)
  }
  return result
}

function deepmerge(target, src, combine, isRule) {
  /*
   * This code is inspired from deepmerge and eslint
   * (https://github.com/KyleAMathews/deepmerge)
   */
  const array = isArray(src) || isArray(target)
  let dst = (array && []) || {}

  if (array) {
    const resolvedTarget = target || []

    // src could be a string, so check for array
    if (isRule && Array.isArray(src) && src.length > 1) {
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
          dst[i] = deepmerge(resolvedTarget[i], e, combine, isRule)
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
        dst[key] = (target[key] || []).concat(src[key] || [])
      } else if (Array.isArray(src[key]) || Array.isArray(target[key])) {
        dst[key] = deepmerge(target[key], src[key], key === 'plugins' || key === 'extends', isRule)
      } else if (typeof src[key] !== 'object' || !src[key] || key === 'exported' || key === 'astGlobals') {
        dst[key] = src[key]
      } else {
        dst[key] = deepmerge(target[key] || {}, src[key], combine, key === 'rules')
      }
    }
  }

  return dst
}

let _resolvePaths

function getResolvePathsSet() {
  if (!_resolvePaths) {
    _resolvePaths = new Set(
      (
        (require.resolve && require.resolve.paths && require.resolve.paths(module.exports.baseFolder)) ||
        Module._nodeModulePaths(module.exports.baseFolder)
      ).filter(x => !isGlobalPath(x) && existsSync(x))
    )
    const thisPackage = path.join(__dirname, 'node_modules')
    if (existsSync(thisPackage)) {
      _resolvePaths.add(thisPackage)
    }
  }
  return _resolvePaths
}

/**
 * Tries to resolve the path of a module.
 * @param {string} id The module to resolve.
 * @returns {string|null} The resolved module path or null if not found.
 */
function hasLocalPackage(id) {
  if (id.startsWith('.')) {
    id = path.resolve(module.exports.baseFolder, id)
  } else if (id.startsWith(path.sep) || id.startsWith('/')) {
    id = path.resolve(id)
  }
  let result = _hasLocalPackageCache.get(id)
  if (result === undefined) {
    result = false
    try {
      if (!isGlobalPath(require.resolve(id))) {
        result = true
      }
    } catch (_error) {}
    _hasLocalPackageCache.set(id, result)
  }
  return result
}

function hasPackage(id) {
  if (id.startsWith('.')) {
    id = path.resolve(module.exports.baseFolder, id)
  } else if (id.startsWith(path.sep) || id.startsWith('/')) {
    id = path.resolve(id)
  }
  let result = _hasPackageCache.get(id)
  if (result === undefined) {
    result = false
    try {
      if (require.resolve(id)) {
        result = true
      }
    } catch (_error) {}
    _hasPackageCache.set(id, result)
  }
  return result
}

function _nodeModulePaths(from) {
  const set = new Set()
  let customAdded = false
  const defaults = _oldNodeModulePaths.call(Module, from)

  for (let i = 0, defaultsLen = defaults.length; i !== defaultsLen; ++i) {
    const value = defaults[i]
    if (!customAdded && _globalPathsSet.has(value)) {
      customAdded = true
      for (const p of _resolvePaths || getResolvePathsSet()) {
        set.add(p)
      }
    }
    set.add(defaults[i])
  }
  if (!customAdded) {
    for (const p of _resolvePaths || getResolvePathsSet()) {
      set.add(p)
    }
  }
  return arrayFrom(set)
}

function addNodeRequirePath(additionalPath) {
  getResolvePathsSet().add(path.resolve(additionalPath))
}

function defineLazyProperty(target, name, getter) {
  defineProperty(target, name, {
    get() {
      const result = getter()
      this[name] = result
      return result
    },
    set(value) {
      defineProperty(target, name, {
        value,
        configurable: true,
        writable: true,
        enumerable: true
      })
    },
    configurable: true,
    enumerable: true
  })
}

/**
 * Checks if a path is a global require module path.
 * @param {string|null|undefined} filepath The file path to check
 * @returns {boolean} True if the path is a global node_modules path, false if not.
 */
function isGlobalPath(filepath) {
  if (typeof filepath === 'string' && filepath.length !== 0) {
    if (filepath.startsWith(module.exports.baseFolder)) {
      return false
    }
    if (_globalPathsSet.has(filepath)) {
      return true
    }
    for (let i = 0; i < _globalPathsArray.length; ++i) {
      if (filepath.startsWith(_globalPathsArray[i])) {
        return true
      }
    }
  }
  return false
}

_oldNodeModulePaths = Module._nodeModulePaths
if (typeof _oldNodeModulePaths !== 'function') {
  throw new Error(`Module._nodeModulePaths is undefined. Maybe node version ${process.version} does not support it?`)
}
Module._nodeModulePaths = _nodeModulePaths

module.exports.defaultReactVersion = '16.8.6'

module.exports.reactVersion = module.exports.defaultReactVersion

module.exports.hasEslintPluginImport = false

module.exports.hasEslintPluginNode = false

module.exports.hasBabelEslintParser = false

module.exports.hasEslintPluginReact = false

module.exports.hasEslintPluginJsxA11y = false

module.exports.hasEslintPluginJest = false

module.exports.hasEslintPluginMocha = false

module.exports.hasEslintPluginChaiExpect = false

module.exports.hasEslintPluginPromise = false

module.exports.hasEslintPluginJson = false

const {
  addEslintConfigPrettierRules,
  getPrettier,
  getPrettierConfig
} = require('eslint-plugin-quick-prettier/eslint-helpers')

module.exports.addEslintConfigPrettierRules = addEslintConfigPrettierRules

module.exports.getPrettier = getPrettier

module.exports.getPrettierConfig = getPrettierConfig

defineLazyProperty(module.exports, 'reactVersion', () => {
  let version = module.exports.defaultReactVersion
  if (module.exports.hasLocalPackage('react')) {
    try {
      version = require('react/package.json').version
    } catch (_error) {}
  }
  return version
})

defineLazyProperty(
  module.exports,
  'hasTypescript',
  () =>
    module.exports.hasLocalPackage('@typescript-eslint/parser') &&
    module.exports.hasLocalPackage('@typescript-eslint/eslint-plugin') &&
    module.exports.hasLocalPackage('typescript')
)

defineLazyProperty(module.exports, 'hasEslintPluginCssModules', () =>
  module.exports.hasLocalPackage('eslint-plugin-css-modules')
)
defineLazyProperty(module.exports, 'hasEslintPluginImport', () =>
  module.exports.hasLocalPackage('eslint-plugin-import')
)
defineLazyProperty(module.exports, 'hasEslintPluginNode', () => module.exports.hasLocalPackage('eslint-plugin-node'))
defineLazyProperty(module.exports, 'hasBabelEslintParser', () => module.exports.hasLocalPackage('babel-eslint'))
defineLazyProperty(module.exports, 'hasEslintPluginReact', () => module.exports.hasLocalPackage('eslint-plugin-react'))
defineLazyProperty(
  module.exports,
  'hasEslintPluginJsxA11y',
  () => module.exports.hasLocalPackage('eslint-plugin-jsx-a11y') && module.exports.hasPackage('@babel/runtime')
)

defineLazyProperty(
  module.exports,
  'hasEslintPluginJest',
  () =>
    module.exports.hasPackage('eslint-plugin-jest') &&
    (module.exports.hasPackage('jest') || fs.existsSync(path.join(module.exports.baseFolder, 'jest.config.js')))
)

defineLazyProperty(module.exports, 'hasEslintPluginMocha', () => module.exports.hasPackage('eslint-plugin-mocha'))

defineLazyProperty(module.exports, 'hasEslintPluginChaiExpect', () =>
  module.exports.hasPackage('eslint-plugin-chai-expect')
)

defineLazyProperty(module.exports, 'hasEslintPluginPromise', () => module.exports.hasPackage('eslint-plugin-promise'))

defineLazyProperty(module.exports, 'hasEslintPluginJson', () => module.exports.hasPackage('eslint-plugin-json'))
