'use strict'

/* eslint-disable global-require */

if (!process || !process.version || process.version.match(/v(\d+)\./)[1] < 10) {
  throw new Error(`Node 10.15.0 or greater is required. Current version is ${process && process.version}`)
}

const Module = require('module')
const path = require('path')
const os = require('os')
const fs = require('fs')
const { statSync, readFileSync } = require('fs')

const { resolve: pathResolve } = path
const { from: arrayFrom } = Array

/** @type {{ (from: string): string[] }} */
let legacyNodeModulePaths = Module._nodeModulePaths

if (typeof legacyNodeModulePaths !== 'function') {
  throw new Error(
    `Module._nodeModulePaths is ${typeof legacyNodeModulePaths}. Maybe node version ${
      process.version
    } does not support it?`
  )
}

legacyNodeModulePaths = legacyNodeModulePaths.bind(Module)

exports.legacyNodeModulePaths = legacyNodeModulePaths

let _eslintPath

/** @type {Set<string>} */
const _resolvePaths = new Set()

/** @type {Map<string, 0|1|2>} */
const _hasLocalPackageCache = new Map()

/** @type {Set<string>} */
const _nonLocalPathsSet = new Set(Module.globalPaths)
_nonLocalPathsSet.add(pathResolve('/'))
_nonLocalPathsSet.add(pathResolve('/node_modules'))
_nonLocalPathsSet.add(pathResolve(os.homedir() || '/', 'node_modules'))

const cwdNodeModules = path.join(process.cwd(), 'node_modules')

/**
 * Gets the node modules paths to use to resolve a module.
 * @param {string} from The initial path.
 * @returns {string[]} The node module paths to use.
 */
function nodeModulePaths(from = process.cwd()) {
  let customAdded = false
  const set = new Set()
  const defaults = legacyNodeModulePaths(from)
  for (let i = 0, defaultsLen = defaults.length; i !== defaultsLen; ++i) {
    const value = defaults[i]
    if (!customAdded && value === cwdNodeModules) {
      set.add(value)
      customAdded = true
      for (const p of _resolvePaths) {
        set.add(p)
      }
    } else if (!customAdded && _nonLocalPathsSet.has(value)) {
      customAdded = true
      for (const p of _resolvePaths) {
        set.add(p)
      }
    }
    set.add(value)
  }
  if (!customAdded) {
    for (const p of _resolvePaths) {
      set.add(p)
    }
  }
  return arrayFrom(set)
}

exports.nodeModulePaths = nodeModulePaths

/** @type {boolean} True if this package was installed globally. */
const isInstalledGlobally = isGlobalPath(__dirname)

exports.isInstalledGlobally = isInstalledGlobally

/**
 * Returns 1 if a package is installed locally, 2 if a package is installed globally, 0 if not found.
 * @param {string} id The package name
 */
function getPackageLocalState(id) {
  if (typeof id !== 'string' || id.length === 0) {
    return 0
  }
  if (id.startsWith('.')) {
    id = pathResolve(process.cwd(), id)
  } else if (id.startsWith(path.sep) || id.startsWith('/')) {
    id = pathResolve(id)
  }
  let result = _hasLocalPackageCache.get(id)
  if (result === undefined) {
    result = 0
    try {
      const resolved = require.resolve(id.endsWith('/package.json') ? id : `${id}/package.json`)
      result = isGlobalPath(resolved) ? 2 : 1
    } catch (_error) {}
    _hasLocalPackageCache.set(id, result)
  }
  return result
}

/**
 * Checks wether the given module exists and is installed.
 * @param {string} id The module to resolve.
 * @returns {boolean} True if the module is present and installed, false if not.
 */
function hasPackage(id) {
  return getPackageLocalState(id) !== 0
}

exports.hasPackage = hasPackage

/**
 * Checks wether the given module exists and is installed locally.
 * @param {string} id The module to resolve.
 * @returns {boolean} True if the module is present and installed locally, false if not.
 */
function hasLocalPackage(id) {
  return getPackageLocalState(id) === 1
}

exports.hasLocalPackage = hasLocalPackage

/**
 * Checks if a path is a global require module path.
 * @param {string|null|undefined} filepath The file path to check
 * @returns {boolean} True if the path is a global node_modules path, false if not.
 */
function isGlobalPath(filepath) {
  if (typeof filepath !== 'string' || filepath.length === 0) {
    return false
  }
  if (filepath.startsWith(process.cwd())) {
    return false
  }
  if (_nonLocalPathsSet.has(filepath)) {
    return true
  }
  const globalPathsArray = Module.globalPaths
  if (Array.isArray(globalPathsArray)) {
    for (let i = 0; i < globalPathsArray.length; ++i) {
      if (filepath.startsWith(globalPathsArray[i])) {
        return true
      }
    }
  }
  return false
}

exports.isGlobalPath = isGlobalPath

/**
 * Gets the path of the eslint module.
 * Returns null if not found.
 * @returns {string|null} The path of eslint module or null if not found.
 */
function getEslintPath() {
  if (_eslintPath === undefined) {
    try {
      _eslintPath = path.dirname(require.resolve('eslint'))
    } catch (_error) {}
  }
  for (const p of nodeModulePaths(__dirname)) {
    try {
      const resolved = path.resolve(p, 'eslint', 'package.json')
      if (fs.statSync(resolved).isFile()) {
        _eslintPath = path.dirname(resolved)
        return _eslintPath
      }
    } catch (_error) {}
  }
  return _eslintPath
}

exports.getEslintPath = getEslintPath

let _eslintVersion = null

/**
 * Gets the currently installed eslint version.
 *
 * @returns {string} The eslint version
 */
function getEslintVersion() {
  if (_eslintVersion === undefined) {
    try {
      _eslintVersion = eslintRequire('./package.json').version
    } catch (_error) {
      _eslintVersion = ''
    }
  }
  return _eslintVersion
}

exports.getEslintVersion = getEslintVersion

let _minimumSupportedEslintVersion

function getMinimumSupportedEslintVersion() {
  if (!_minimumSupportedEslintVersion) {
    const pkg = require('../package.json')
    const peerDependencies = pkg.peerDependencies
    const devDependencies = pkg.devDependencies
    _minimumSupportedEslintVersion =
      (peerDependencies && peerDependencies.eslint) || (devDependencies && devDependencies.eslint) || '6.1.0'
    if (
      _minimumSupportedEslintVersion.startsWith('>') ||
      _minimumSupportedEslintVersion.startsWith('~') ||
      _minimumSupportedEslintVersion.startsWith('^')
    ) {
      _minimumSupportedEslintVersion = _minimumSupportedEslintVersion.slice(1)
    }
    if (_minimumSupportedEslintVersion.startsWith('=')) {
      _minimumSupportedEslintVersion = _minimumSupportedEslintVersion.slice(1)
    }
  }
  return _minimumSupportedEslintVersion
}

exports.getMinimumSupportedEslintVersion = getMinimumSupportedEslintVersion

function eslintResolve(id) {
  if (id.startsWith('eslint/')) {
    id = `.${id.slice('eslint'.length)}`
  }
  const eslintPath = getEslintPath()
  if (eslintPath) {
    try {
      if (id.startsWith('.')) {
        return require.resolve(pathResolve(eslintPath, id), { paths: nodeModulePaths(eslintPath) })
      }
      return require.resolve(id, { paths: nodeModulePaths(eslintPath) })
    } catch (error) {
      if (!error || error.code !== 'MODULE_NOT_FOUND') {
        throw error
      }
    }
  }
  if (id.startsWith('./')) {
    return require.resolve(`eslint${id.slice(1)}`)
  }
  return require.resolve(id)
}

/**
 * Requires a module from the point of view of eslint.
 * @param {string} id The module to require.
 */
function eslintRequire(id) {
  return require(eslintResolve(id))
}

eslintRequire.resolve = eslintResolve

exports.eslintRequire = eslintRequire

function resolvePackageFolder(packageName) {
  try {
    return path.dirname(require.resolve(`${packageName}/package.json`))
  } catch (_error) {
    return undefined
  }
}

// Overrides Module._nodeModulePaths so eslint is able to resolve plugin modules in the right places
Module._nodeModulePaths = nodeModulePaths

reloadNodeResolvePaths()

const prettierInterface = require('eslint-plugin-quick-prettier/prettier-interface')

prettierInterface.loadDefaultPrettierConfig = function loadDefaultPrettierConfig() {
  try {
    return JSON.parse(readFileSync(path.join(path.dirname(__dirname), '.prettierrc')))
  } catch (error) {
    if (!error || error.code !== 'ENOENT') {
      throw error
    }
  }
  return {}
}

module.exports.prettierInterface = prettierInterface

function reloadNodeResolvePaths() {
  _eslintPath = undefined
  _eslintVersion = undefined
  _resolvePaths.clear()
  _hasLocalPackageCache.clear()

  const _directoryExistsCache = new Map()

  // Register additional paths

  addNodeResolvePath(process.cwd())
  addNodeResolvePath(path.dirname(__dirname))
  addNodeResolvePath(path.dirname(path.dirname(__dirname)))

  addNodeResolvePath(resolvePackageFolder('eslint'))
  addNodeResolvePath(resolvePackageFolder('eslint-plugin-quick-prettier'))
  addNodeResolvePath(resolvePackageFolder('acuris-shared-component-tools'))

  for (const p of legacyNodeModulePaths(path.dirname(process.cwd()))) {
    addNodeResolvePath(p)
  }

  _resolvePaths.add(path.resolve(process.cwd(), 'node_modules'))

  require('eslint-plugin-quick-prettier/prettier-interface').reloadPrettier()

  function directoryExists(directory) {
    if (typeof directory !== 'string' || directory.length === 0) {
      return false
    }
    let found = _directoryExistsCache.get(directory)
    if (found === undefined) {
      try {
        found = statSync(directory).isDirectory()
      } catch (_error) {
        found = false
      }
      _directoryExistsCache.set(directory, found)
    }
    return found
  }

  function addNodeResolvePath(folder) {
    if (typeof folder !== 'string') {
      return
    }

    folder = path.resolve(folder)
    if (!path.basename(folder) !== 'node_modules') {
      folder = path.join(folder, 'node_modules')
    }

    if (_resolvePaths.has(folder)) {
      return
    }

    if (directoryExists(folder)) {
      if (!isInstalledGlobally && isGlobalPath(folder)) {
        return
      }
      _resolvePaths.add(folder)
    }

    const p = path.dirname(path.dirname(folder))

    const parentNodeModules = path.join(p, 'node_modules')
    if (!_resolvePaths.has(parentNodeModules) && directoryExists(parentNodeModules)) {
      if (isInstalledGlobally || !isGlobalPath(parentNodeModules)) {
        _resolvePaths.add(parentNodeModules)
      }
    }

    const parentParentNodeModules = path.join(path.dirname(p), 'node_modules')
    if (!_resolvePaths.has(parentParentNodeModules) && directoryExists(parentParentNodeModules)) {
      if (isInstalledGlobally || !isGlobalPath(parentParentNodeModules)) {
        _resolvePaths.add(parentParentNodeModules)
      }
    }
  }

  patchEslintScope()
}

/**
 * This is currently required to make babel-eslint with eslint >= 6.1
 * This can be removed once babel-eslint fix no-unused-var for for loops
 */
function patchEslintScope() {
  if (hasLocalPackage('babel-eslint')) {
    const libFiles = [
      'definition.js',
      'pattern-visitor.js',
      'referencer.js',
      'scope.js',
      'index.js',
      'reference.js',
      'scope-manager.js',
      'variable.js'
    ]

    for (const libFile of libFiles) {
      const subPath = `/lib/${libFile}`

      let babelEslintEslintScope
      try {
        // eslint-disable-next-line node/no-unpublished-require
        babelEslintEslintScope = require.resolve(`babel-eslint/node_modules/eslint-scope${subPath}`)
      } catch (_error) {}

      if (babelEslintEslintScope) {
        let eslintScopePath
        try {
          eslintScopePath = eslintResolve(`eslint-scope${subPath}`)
        } catch (_error) {}
        try {
          eslintScopePath = require.resolve(`eslint-scope${subPath}`)
        } catch (_error) {}
        if (eslintScopePath) {
          try {
            require(eslintScopePath)
          } catch (_error) {}
          const cached = require.cache[eslintScopePath]
          if (cached) {
            require.cache[babelEslintEslintScope] = cached
          }
        }
      }
    }
  }
}

module.exports.reloadNodeResolvePaths = reloadNodeResolvePaths

module.exports.jsonUtils = require('eslint-plugin-quick-prettier/json-utils')
