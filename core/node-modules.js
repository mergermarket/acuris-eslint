'use strict'

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

/** @type {string[]} */
const _globalPathsArray = Module.globalPaths || []

const _homeDirNodeModules = path.resolve(os.homedir() || '/', 'node_modules')

/** @type {Set<string>} */
const _nonLocalPathsSet = new Set(_globalPathsArray)
_nonLocalPathsSet.add(os.homedir())
_nonLocalPathsSet.add(_homeDirNodeModules)
_nonLocalPathsSet.add(pathResolve('/node_modules'))
_nonLocalPathsSet.add(pathResolve('/'))

if (typeof _defaultNodeModulePaths !== 'function') {
  throw new Error(
    `Module._nodeModulePaths is ${typeof _defaultNodeModulePaths}. Maybe node version ${
      process.version
    } does not support it?`
  )
}

exports.baseFolder = process.cwd()

exports.addNodeRequirePath = addNodeRequirePath

exports.addNodeRequirePathRecursive = addNodeRequirePathRecursive

/**
 * Checks wether the given module exists and is installed.
 * @param {string} id The module to resolve.
 * @returns {boolean} True if the module is present and installed, false if not.
 */
exports.hasPackage = function hasPackage(id) {
  if (id.startsWith('.')) {
    id = path.resolve(exports.baseFolder, id)
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
  return !!result
}

/**
 * Checks wether the given module exists and is installed locally.
 * @param {string} id The module to resolve.
 * @returns {boolean} True if the module is present and installed locally, false if not.
 */
exports.hasLocalPackage = function hasLocalPackage(id) {
  if (id.startsWith('.')) {
    id = path.resolve(exports.baseFolder, id)
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
  return result === 1
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
  if (filepath.startsWith(exports.baseFolder)) {
    return false
  }
  if (_nonLocalPathsSet.has(filepath)) {
    return true
  }
  if (exports.isInstalledGlobally) {
    return false
  }
  for (let i = 0; i < _globalPathsArray.length; ++i) {
    if (filepath.startsWith(_globalPathsArray[i])) {
      return true
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
  if (isGlobalPath(directory)) {
    return
  }
  if (!existsSync(directory)) {
    return
  }
  _resolvePaths.add(directory)
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

function getResolvePathsSet() {
  if (!_resolvePaths) {
    _resolvePaths = new Set()
    addNodeRequirePathRecursive(__dirname)
    addNodeRequirePathRecursive(path.join(exports.baseFolder, 'package.json'))
    addNodeRequirePath(path.dirname(path.dirname(__dirname)))
  }
  return _resolvePaths
}

/**
 * Gets the node modules paths to use to resolve a module.
 * @param {string} from The initial path.
 * @returns {string[]} The node module paths to use.
 */
function nodeModulePaths(from = exports.baseFolder) {
  const set = new Set()
  let customAdded = false
  const defaults = _defaultNodeModulePaths.call(Module, from)
  for (let i = 0, defaultsLen = defaults.length; i !== defaultsLen; ++i) {
    const value = defaults[i]
    if (!customAdded && _nonLocalPathsSet.has(value)) {
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
