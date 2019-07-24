'use strict'

/* eslint-disable global-require */

if (!process || !process.version || process.version.match(/v(\d+)\./)[1] < 8) {
  throw new Error(`Node 8.10.0 or greater is required. Current version is ${process && process.version}`)
}

const path = require('path')
const Module = require('module')
const { existsSync } = require('fs')
const os = require('os')

const { resolve: pathResolve } = path
const { from: arrayFrom } = Array

/** @type {{ (from: string): string[] }} */
const _defaultNodeModulePaths = Module._nodeModulePaths

/** @type {Set<string> | null} */
let _resolvePaths = null

/** @type {Map<string, 0|1|2>} */
const _hasLocalPackageCache = new Map()

const _homeDirNodeModules = path.resolve(os.homedir() || '/', 'node_modules')

/** @type {Set<string>} */
let _nonLocalPathsSet

function getNonLocalPathsSet() {
  if (!_nonLocalPathsSet) {
    _nonLocalPathsSet = new Set(Module.globalPaths)
    _nonLocalPathsSet.add(os.homedir())
    _nonLocalPathsSet.add(_homeDirNodeModules)
    _nonLocalPathsSet.add(pathResolve('/node_modules'))
    _nonLocalPathsSet.add(pathResolve('/'))
  }
  return _nonLocalPathsSet
}

if (typeof _defaultNodeModulePaths !== 'function') {
  throw new Error(
    `Module._nodeModulePaths is ${typeof _defaultNodeModulePaths}. Maybe node version ${
      process.version
    } does not support it?`
  )
}

exports.addNodeRequirePath = addNodeRequirePath

/**
 * Returns 1 if a package is installed locally, 2 if a package is installed globally, 0 if not found.
 * @param {string} id The package name
 */
function getPackageLocalState(id) {
  if (typeof id !== 'string' || id.length === 0) {
    return 0
  }
  if (id.startsWith('.')) {
    id = path.resolve(process.cwd(), id)
  } else if (id.startsWith(path.sep) || id.startsWith('/')) {
    id = path.resolve(id)
  }
  let result = _hasLocalPackageCache.get(id)
  if (result === undefined) {
    result = 0
    try {
      result = isGlobalPath(require.resolve(id)) ? 2 : 1
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
exports.hasPackage = function hasPackage(id) {
  return getPackageLocalState(id) !== 0
}

/**
 * Checks wether the given module exists and is installed locally.
 * @param {string} id The module to resolve.
 * @returns {boolean} True if the module is present and installed locally, false if not.
 */
exports.hasLocalPackage = function hasLocalPackage(id) {
  return getPackageLocalState(id) === 1
}

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
  if (getNonLocalPathsSet().has(filepath)) {
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

exports.nodeModulePaths = nodeModulePaths

/**
 * Adds a specific path to the node require mechanism so a package can be found there
 * @param {string|string[]} directory
 */
function addNodeRequirePath(directory) {
  if (_resolvePaths === null) {
    _resolvePaths = getResolvePathsSet()
  }
  if (_resolvePaths.has(directory)) {
    return
  }
  directory = pathResolve(directory)
  if (_resolvePaths.has(directory)) {
    return
  }
  if (!exports.isInstalledGlobally && isGlobalPath(directory)) {
    return
  }
  if (!existsSync(directory)) {
    return
  }
  _resolvePaths.add(directory)
}

function addNodeModulesRequirePath(directory) {
  directory = path.resolve(directory)
  if (!directory.endsWith('node_modules')) {
    directory = path.join(directory, 'node_modules')
  }
  addNodeRequirePath(directory)
}

/**
 * Adds a path to the node require mechanism so a package can be found there.
 * It adds also parent folders node_modules.
 * @param {string|string[]} from
 * @param {boolean} [recursive]
 */
function addNodeRequirePathRecursive(from) {
  from = pathResolve(from)
  const paths =
    (require.resolve && require.resolve.paths && require.resolve.paths(from)) || Module._nodeModulePaths(from) || []
  for (const p of paths) {
    addNodeRequirePath(p)
  }
}

let _eslintPath

/**
 * Gets the path of the eslint module.
 * Returns null if not found.
 * @returns {string|null} The path of eslint module or null if not found.
 */
function getEslintPath() {
  if (_eslintPath === undefined) {
    try {
      _eslintPath = path.dirname(require.resolve('eslint/package.json'))
    } catch (_error) {
      _eslintPath = null
    }
  }
  return _eslintPath
}

exports.getEslintPath = getEslintPath

function eslintResolve(id) {
  const eslintPath = getEslintPath()
  if (eslintPath) {
    try {
      if (id.startsWith('.')) {
        return require.resolve(path.resolve(eslintPath, id), { paths: nodeModulePaths(eslintPath) })
      }
      return require.resolve(id, { paths: nodeModulePaths(eslintPath) })
    } catch (error) {
      if (!error || error.code !== 'MODULE_NOT_FOUND') {
        throw error
      }
    }
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

function getResolvePathsSet() {
  if (!_resolvePaths) {
    _resolvePaths = new Set()
    addNodeRequirePath(path.dirname(path.dirname(__dirname)))
    addNodeModulesRequirePath(path.dirname(__dirname))
    addNodeModulesRequirePath(path.resolve(process.cwd(), 'package.json'))

    const eslintPath = getEslintPath()

    if (eslintPath) {
      if (!exports.isInstalledGlobally && isGlobalPath(eslintPath)) {
        addNodeRequirePathRecursive(__dirname)
        addNodeModulesRequirePath(path.dirname(eslintPath))
      } else {
        addNodeRequirePathRecursive(path.join(eslintPath, 'package.json'))
      }
    } else {
      addNodeRequirePathRecursive(__dirname)
    }
  }
  return _resolvePaths
}

/**
 * Gets the node modules paths to use to resolve a module.
 * @param {string} from The initial path.
 * @returns {string[]} The node module paths to use.
 */
function nodeModulePaths(from = process.cwd()) {
  const set = new Set()
  let customAdded = false
  const defaults = _defaultNodeModulePaths.call(Module, from)
  for (let i = 0, defaultsLen = defaults.length; i !== defaultsLen; ++i) {
    const value = defaults[i]
    if (!customAdded && getNonLocalPathsSet().has(value)) {
      customAdded = true
      for (const p of getResolvePathsSet()) {
        set.add(p)
      }
    }
    set.add(defaults[i])
  }
  if (!customAdded) {
    for (const p of getResolvePathsSet()) {
      set.add(p)
    }
  }
  return arrayFrom(set)
}

// Overrides Module._nodeModulePaths so eslint is able to resolve plugin modules in the right places
Module._nodeModulePaths = nodeModulePaths

/** @type {boolean} True if this package was installed globally. */
exports.isInstalledGlobally = isGlobalPath(__dirname)
