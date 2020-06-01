'use strict'

/* eslint-disable global-require */

const Module = require('module')
const os = require('os')
const { existsSync, statSync } = require('fs')

const {
  resolve: pathResolve,
  dirname: pathDirname,
  basename: pathBasename,
  join: pathJoin,
  sep: pathSep
} = require('path')

const { from: arrayFrom } = Array

// Hides createRequireFromPath deprecation warning when used
// eslint-disable-next-line node/no-deprecated-api
Module.createRequireFromPath = Module.createRequire

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

let _cwdNodeModules

/** @type {Set<string>} */
const _resolvePackageNames = new Set()

/** @type {Set<string>} */
const _resolvePaths = new Set()

/** @type {Map<string, 0|1|2>} */
const _hasLocalPackageCache = new Map()

/** @type {Set<string>} */
const _nonLocalPathsSet = new Set(Module.globalPaths)
_nonLocalPathsSet.add(pathResolve('/'))
_nonLocalPathsSet.add(pathResolve('/node_modules'))
_nonLocalPathsSet.add(pathResolve(os.homedir() || '/', 'node_modules'))

/**
 * Gets the node modules paths to use to resolve a module.
 * @param {string} from The initial path.
 * @returns {string[]} The node module paths to use.
 */
function nodeModulePaths(from = process.cwd()) {
  let customAdded = false
  const set = new Set()
  const defaults = legacyNodeModulePaths(from)
  const cwdNodeModules = _cwdNodeModules || (_cwdNodeModules = pathResolve('node_modules'))
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
  } else if (id.startsWith(pathSep) || id.startsWith('/')) {
    id = pathResolve(id)
  }
  let result = _hasLocalPackageCache.get(id)
  if (result === undefined) {
    result = 0
    if (!exports.projectConfig.ignoredPackages.has(id)) {
      try {
        const resolved = require.resolve(id.endsWith('/package.json') ? id : `${id}/package.json`)
        result = isGlobalPath(resolved) ? 2 : 1
      } catch (_error) {}
    }
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

exports.assertEslintVersion = assertEslintVersion

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

let _eslintRequire
let _eslintPackageJsonPath
const _eslintRequireCache = new Map()

exports.eslintRequire = eslintRequire

exports.eslintTryRequire = eslintTryRequire

exports.eslintPackageJsonPath = eslintPackageJsonPath

function eslintPackageJsonPath() {
  if (_eslintPackageJsonPath === undefined) {
    try {
      _eslintPackageJsonPath = require.resolve('eslint/package.json')
    } catch (_) {
      _eslintPackageJsonPath = ''
    }
  }
  return _eslintPackageJsonPath
}

/**
 * Requires a module from the point of view of eslint.
 * @param {string} id The module to require.
 */
function eslintRequire(id) {
  const found = _eslintRequireCache.get(id)
  if (found !== undefined) {
    return found
  }
  try {
    const doRequire = _eslintRequire || Module.createRequire(eslintPackageJsonPath())
    const result = doRequire(id)
    _eslintRequireCache.set(id, result)
    return result
  } catch (error) {
    _eslintRequireCache.set(id, undefined)
    throw error
  }
}

function eslintTryRequire(id) {
  if (_eslintRequireCache.has(id)) {
    return _eslintRequireCache.get(id)
  }
  try {
    const doRequire = _eslintRequire || Module.createRequire(eslintPackageJsonPath())
    const result = doRequire(id)
    _eslintRequireCache.set(id, result)
    return result
  } catch (error) {
    _eslintRequireCache.set(id, undefined)
    return undefined
  }
}

// Overrides Module._nodeModulePaths so eslint is able to resolve plugin modules in the right places
Module._nodeModulePaths = nodeModulePaths

exports.projectConfig = require('./project-config').projectConfig

reloadNodeResolvePaths()

function reloadNodeResolvePaths() {
  _eslintRequire = undefined
  _eslintPackageJsonPath = undefined
  _eslintVersion = undefined
  _resolvePaths.clear()
  _hasLocalPackageCache.clear()
  _eslintRequireCache.clear()

  const _directoryExistsCache = new Map()

  // Register additional paths

  for (const nodeResolvePaths of exports.projectConfig.nodeResolvePaths) {
    addNodeResolvePath(nodeResolvePaths)
  }

  const cwd = process.cwd()

  const env = process.env
  const options = new Set([cwd, env.INIT_CWD, env.OLDPWD].filter(Boolean).map((x) => pathResolve(x)))

  addNodeResolvePath(options)

  addNodeResolvePath(pathDirname(__dirname))
  addNodeResolvePath(pathDirname(pathDirname(__dirname)))

  let sharedComponentToolsPath
  try {
    sharedComponentToolsPath = pathDirname(require.resolve('acuris-shared-component-tools/package.json'))
  } catch (_error) {}
  if (sharedComponentToolsPath) {
    addNodeResolvePath(sharedComponentToolsPath)
    for (const relative of _resolvePackageNames) {
      addNodeResolvePath(pathJoin(sharedComponentToolsPath, 'node_modules', relative))
    }
  }

  try {
    addNodeResolvePath(pathDirname(require.resolve('eslint/package.json')))
  } catch (_error) {}

  for (const p of legacyNodeModulePaths(cwd)) {
    if (!_resolvePaths.has(p) && directoryExists(p)) {
      addNodeResolvePath(p)
    }
  }

  _resolvePaths.add(pathResolve('node_modules'))

  function directoryExists(directory) {
    if (typeof directory !== 'string' || directory.length === 0) {
      return false
    }
    let found = _directoryExistsCache.get(directory)
    if (found === undefined) {
      directory = pathResolve(directory)
      found = _directoryExistsCache.get(directory)
    }
    if (found === undefined) {
      try {
        found = existsSync(directory) && statSync(directory).isDirectory()
      } catch (_error) {
        found = false
      }
      if (found) {
        for (let current = directory; ; ) {
          if (_directoryExistsCache.has(current)) {
            break
          }
          _directoryExistsCache.set(current, true)
          const parent = pathDirname(current)
          if (!parent || parent.length === current.length) {
            break
          }
          current = parent
        }
      } else {
        _directoryExistsCache.set(directory, found)
      }
    }
    return found
  }

  function getPackageNameFromFolder(folder) {
    if (typeof folder !== 'string' || folder.length === 0) {
      return undefined
    }
    if (folder.endsWith(pathSep)) {
      folder = folder.slice(0, folder.length - 1)
    }
    if (folder.endsWith(`${pathSep}node_modules`)) {
      folder = pathDirname(folder)
    }

    const result = pathBasename(folder)
    if (!result || result.startsWith('@')) {
      return undefined
    }

    const parentName = pathBasename(pathDirname(folder))
    if (parentName && parentName.startsWith('@')) {
      return `${parentName}/${result}`
    }

    return result
  }

  function addNodeResolvePath(folder) {
    if (typeof folder !== 'string') {
      return
    }

    folder = pathResolve(folder)

    if (!folder) {
      return
    }

    let baseName = pathBasename(folder)
    if (baseName.startsWith('@') && baseName.indexOf('node_modules') > 0) {
      baseName = pathDirname(baseName)
    }

    if (pathBasename(folder) !== 'node_modules') {
      folder = pathResolve(folder, 'node_modules')
    }

    if (_resolvePaths.has(folder)) {
      return
    }

    const packageName = getPackageNameFromFolder(folder)
    if (packageName) {
      _resolvePackageNames.add(packageName)
    }

    if (!_resolvePaths.has(folder) && directoryExists(folder)) {
      if (!isInstalledGlobally && isGlobalPath(folder)) {
        return
      }
      _resolvePaths.add(folder)
    }

    const p = pathDirname(pathDirname(folder))

    const parentNodeModules = pathResolve(p, 'node_modules')
    if (!_resolvePaths.has(parentNodeModules) && directoryExists(parentNodeModules)) {
      if (isInstalledGlobally || !isGlobalPath(parentNodeModules)) {
        _resolvePaths.add(parentNodeModules)
      }
    }

    const parentParentNodeModules = pathResolve(pathDirname(p), 'node_modules')
    if (!_resolvePaths.has(parentParentNodeModules) && directoryExists(parentParentNodeModules)) {
      if (isInstalledGlobally || !isGlobalPath(parentParentNodeModules)) {
        _resolvePaths.add(parentParentNodeModules)
      }
    }
  }
}

function assertEslintVersion() {
  const minVersion = getMinimumSupportedEslintVersion()
  const version = getEslintVersion()
  if (parseFloat(version) < parseFloat(minVersion)) {
    const err = new Error(`eslint version ${version} not supported. Minimum supported version is ${minVersion}.`)
    err.showStack = false
    throw err
  }
}

module.exports.reloadNodeResolvePaths = reloadNodeResolvePaths
