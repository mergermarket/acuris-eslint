'use strict'

/* eslint-disable global-require */

assertNodeVersion()

const Module = require('module')
const path = require('path')
const os = require('os')
const { existsSync, statSync } = require('fs')

const { resolve: pathResolve } = path
const { from: arrayFrom } = Array

class ProjectConfig {
  constructor() {
    this.reactVersion = ''
    this.tsConfigPath = ''

    /** @type {Set<string>} */
    this.ignoredPackages = new Set()

    this.filePatterns = {
      mjs: ['*.mjs'],
      typescript: ['*.ts', '*.tsx'],
      typescriptDefinition: ['*.d.ts'],
      bin: ['**/bin/**/*', '**/.bin/**/*'],
      server: ['**/server/**/*', '**/dev-server/**/*'],
      dist: ['**/dist/**/*', '**/out/**/*', '**/_dist/**/*', '**/_out/**/*', '**/.dist/**/*', '**/.out/**/*'],
      scripts: [
        '**/dev-server/**/*',
        '**/scripts/**/*',
        '**/bin/**/*',
        '**/.bin/**/*',
        '**/build/**/*',
        '.eslintrc.js',
        'webpack.config.*',
        'webpack.*.config.*',
        'jest-*.*',
        '**/testUtils/**/*',
        '**/__mocks__/**/*',
        'Gruntfile.js',
        'gulpfile.js',
        'Gulpfile.js',
        '**/gulp/**/*',
        '**/grunt/**/*',
        '*-jest-*.*',
        '**/.mocharc.*'
      ],
      tests: [
        '*.test.*',
        '*.spec.*',
        '**/test/**/*',
        '**/tests/**/*',
        '**/*-test/**/*',
        '**/*-tests/**/*',
        '**/__mocks__/**/*',
        '**/__specs__/**/*',
        '**/__tests__/**/*',
        '**/__mock__/**/*',
        '**/__spec__/**/*',
        '**/__test__/**/*',
        '**/testUtils/**/*',
        '*-jest-*.*',
        '**/.mocharc.*'
      ]
    }
  }

  addCfg(cfg) {
    for (const [k, v] of Object.keys(this)) {
      const t = typeof v
      if (t === typeof cfg[k] && (t === 'number' || t === 'string' || t === 'boolean')) {
        this[k] = cfg[k]
      }
    }

    const ignPkgs = cfg['ignored-packages']
    if (typeof ignPkgs === 'object' && ignPkgs !== null) {
      if (Array.isArray(ignPkgs)) {
        for (const v of ignPkgs) {
          this.ignoredPackages.add(v)
        }
      } else {
        for (const [k, v] of ignPkgs) {
          if (v) {
            this.ignoredPackages.add(k)
          } else {
            this.ignoredPackages.remove(k)
          }
        }
      }
    }

    const fp = cfg['file-patterns']
    if (typeof fp === 'object' && fp !== null && !Array.isArray(fp)) {
      for (const key of Object.keys(this.filePatterns)) {
        const v = fp[key]
        if (typeof v === 'object' && v !== null) {
          const set = new Set(fp[key])
          if (Array.isArray(v)) {
            for (const item of v) {
              if (typeof item === 'string') {
                if (v.startsWith('!')) {
                  set.delete(v)
                } else {
                  set.add(v)
                }
              }
            }
          } else {
            for (const [pattern, enabled] of Object.entries(fp[key])) {
              if (enabled) {
                set.add(pattern)
              } else {
                set.delete(pattern)
              }
            }
          }
          fp[key] = Array.from(set)
        }
      }
    }
  }

  load(directory = process.cwd()) {
    for (;;) {
      const packageJson = path.join(directory, 'package.json')
      if (existsSync(packageJson)) {
        let pkg
        try {
          pkg = require(packageJson)
        } catch (_error) {}
        const cfg = pkg && pkg['acuris-eslint']
        if (cfg) {
          this.addCfg(cfg)
        }
      }
      const parent = path.dirname(directory)
      if (parent.length >= directory.length) {
        break
      }
      directory = parent
    }
    return this
  }
}

exports.ProjectConfig = ProjectConfig

exports.projectConfig = new ProjectConfig().load()

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
  const cwdNodeModules = _cwdNodeModules || (_cwdNodeModules = path.resolve('node_modules'))
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

exports.eslintRequire = eslintRequire

exports.eslintTryRequire = eslintTryRequire

/**
 * Requires a module from the point of view of eslint.
 * @param {string} id The module to require.
 */
function eslintRequire(id) {
  const r = _eslintRequire || Module.createRequire(require.resolve('eslint/package.json'))
  return r(id)
}

function eslintTryRequire(id) {
  try {
    const r = _eslintRequire || Module.createRequire(require.resolve('eslint/package.json'))
    return r(id)
  } catch (_error) {
    return undefined
  }
}

// Overrides Module._nodeModulePaths so eslint is able to resolve plugin modules in the right places
Module._nodeModulePaths = nodeModulePaths

reloadNodeResolvePaths()

function reloadNodeResolvePaths() {
  _eslintVersion = undefined
  _resolvePaths.clear()
  _hasLocalPackageCache.clear()

  const _directoryExistsCache = new Map()

  // Register additional paths

  addNodeResolvePath(process.cwd())
  addNodeResolvePath(path.dirname(__dirname))
  addNodeResolvePath(path.dirname(path.dirname(__dirname)))

  let sharedComponentToolsPath
  try {
    sharedComponentToolsPath = path.dirname(require.resolve('acuris-shared-component-tools/package.json'))
  } catch (_error) {}
  if (sharedComponentToolsPath) {
    addNodeResolvePath(sharedComponentToolsPath)
    for (const relative of _resolvePackageNames) {
      addNodeResolvePath(path.join(sharedComponentToolsPath, 'node_modules', relative))
    }
  }

  try {
    addNodeResolvePath(path.dirname(require.resolve('eslint/package.json')))
  } catch (_error) {}

  for (const p of legacyNodeModulePaths(path.dirname(process.cwd()))) {
    addNodeResolvePath(p)
  }

  _resolvePaths.add(path.resolve('node_modules'))

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

  function getPackageNameFromFolder(folder) {
    if (typeof folder !== 'string' || folder.length === 0) {
      return undefined
    }
    if (folder.endsWith(path.sep)) {
      folder = folder.slice(0, folder.length - 1)
    }
    if (folder.endsWith(`${path.sep}node_modules`)) {
      folder = path.dirname(folder)
    }

    const result = path.basename(folder)
    if (!result || result.startsWith('@')) {
      return undefined
    }

    const parentName = path.basename(path.dirname(folder))
    if (parentName && parentName.startsWith('@')) {
      return `${parentName}/${result}`
    }

    return result
  }

  function addNodeResolvePath(folder) {
    if (typeof folder !== 'string') {
      return
    }

    folder = path.resolve(folder)

    if (!folder) {
      return
    }

    let baseName = path.basename(folder)
    if (baseName.startsWith('@') && baseName.includes('node_modules')) {
      baseName = path.dirname(baseName)
    }

    if (path.basename(folder) !== 'node_modules') {
      folder = path.join(folder, 'node_modules')
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
}

function assertNodeVersion() {
  let nodeVersion = `${process && process.version}`
  if (nodeVersion.startsWith('v')) {
    nodeVersion = nodeVersion.slice(1)
  }
  const parsed = parseFloat(nodeVersion)
  if (parsed < 12.12) {
    throw new Error(`Node 12.12.0 or greater is required. Current version is ${nodeVersion}`)
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
