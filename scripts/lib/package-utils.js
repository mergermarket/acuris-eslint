const path = require('path')
const nodeModules = require('../../core/node-modules')
const { getRepositoryFromGitConfig, fileExists, findUp } = require('./fs-utils')
const { readTextFile } = require('./text-utils')
const fs = require('fs')
const referencePackageJson = require('../../package.json')
const semver = require('semver')

function addObjectKeysToSet(set, obj) {
  if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
    for (const key of Object.keys(obj)) {
      set.add(key)
    }
  }
}

function getNeededDependencies(manifest, cwd = process.cwd()) {
  const result = new Set()

  const allDeps = new Set()
  addObjectKeysToSet(allDeps, manifest.dependencies)
  addObjectKeysToSet(allDeps, manifest.devDependencies)
  addObjectKeysToSet(allDeps, manifest.peerDependencies)
  addObjectKeysToSet(allDeps, manifest.bundleDependencies)
  addObjectKeysToSet(allDeps, manifest.bundledDependencies)
  addObjectKeysToSet(allDeps, manifest.optionalDependencies)

  const hasDep = name => {
    if (allDeps.has(name)) {
      return true
    }
    if (isPackageInstalled(name)) {
      allDeps.add(name)
      return true
    }
    return false
  }

  if (hasDep('acuris-shared-component-tools')) {
    result.add('acuris-shared-component-tools')
  } else {
    if (manifest.name !== referencePackageJson.name) {
      result.add(referencePackageJson.name)
    }
    addObjectKeysToSet(result, referencePackageJson.peerDependencies)

    if (
      manifest.babel ||
      hasDep('@babel/runtime') ||
      fileExists(path.resolve(cwd, '.babelrc')) ||
      fileExists(path.resolve(cwd, '.babelrc.js'))
    ) {
      result.add('babel-eslint')
    }

    if (manifest.husky || hasDep('husky')) {
      result.add('husky')
    }

    if (manifest['lint-staged'] || hasDep('lint-staged')) {
      result.add('lint-staged')
    }

    if (
      hasDep('typescript') ||
      fileExists(path.resolve(cwd, 'tsconfig.json')) ||
      fileExists(path.resolve(cwd, 'index.ts')) ||
      fileExists(path.resolve(cwd, 'index.d.ts')) ||
      fileExists(path.resolve(cwd, 'src', 'index.ts'))
    ) {
      result.add('@types/node')
      result.add('@typescript-eslint/eslint-plugin')
      result.add('@typescript-eslint/parser')
      result.add('typescript')
    }

    if (hasDep('jest')) {
      result.add('eslint-plugin-jest')
    }

    if (hasDep('mocha')) {
      result.add('eslint-plugin-mocha')
    }

    if (hasDep('mocha') || hasDep('chai')) {
      result.add('eslint-plugin-chai-expect')
    }

    if (hasDep('react') || hasDep('react-scripts') || hasDep('webpack')) {
      result.add('eslint-plugin-jsx-a11y')
      result.add('eslint-plugin-react')
      result.add('eslint-plugin-css-modules')
    }
  }
  return Array.from(result).sort()
}

exports.getNeededDependencies = getNeededDependencies

function sanitisePackageJson(manifest) {
  manifest = JSON.parse(JSON.stringify(manifest))

  if (typeof manifest !== 'object' || manifest === null || Array.isArray(manifest)) {
    throw new Error(`package.json must be an object but is ${Array.isArray(manifest) ? 'Array' : typeof manifest}`)
  }
  if (typeof manifest.name !== 'string' || manifest.name.trim().length === 0) {
    throw new Error('package.json must contain a valid "name" property')
  }
  if (typeof manifest.version !== 'string' || manifest.version.trim().length === 0) {
    throw new Error('package.json must contain a valid "version" property')
  }
  if (!manifest.description) {
    manifest.description = manifest.name
  }
  if (!manifest.keywords) {
    manifest.keywords = [manifest.name]
  }
  if (!manifest.license) {
    manifest.license = 'UNLICENSED'
  }

  if (!manifest.repository) {
    const repository = getRepositoryFromGitConfig()
    if (repository) {
      manifest.repository = repository
    }
  }

  if (!manifest.homepage) {
    let repoUrl = manifest.repository && manifest.repository.url
    if (typeof repoUrl !== 'string' || !repoUrl.startsWith('http')) {
      repoUrl = getRepositoryFromGitConfig()
    }
    if (typeof repoUrl === 'string' && repoUrl.startsWith('http')) {
      if (repoUrl.endsWith('.git')) {
        repoUrl = repoUrl.slice(0, repoUrl.length - '.git'.length)
      }
      manifest.homepage = `${repoUrl}#readme`
    }
  }

  if (referencePackageJson.engines) {
    if (typeof manifest.engines !== 'object' || manifest.engines === null) {
      manifest.engines = {}
    }
    for (const key of Object.keys(referencePackageJson.engines)) {
      if (!manifest.engines[key]) {
        manifest.engines[key] = referencePackageJson.engines[key]
      }
    }
  }

  return manifest
}

exports.sanitisePackageJson = sanitisePackageJson

function semverToVersion(version) {
  if (typeof version !== 'string') {
    return null
  }
  version = version.trim()
  if (version.length === 0) {
    return null
  }

  if (version.startsWith('file:') || version === 'latest') {
    return version
  }

  const indexOfLtEq = version.indexOf('<=')
  if (indexOfLtEq >= 0) {
    const found = semverToVersion(version.slice(indexOfLtEq + 2))
    if (found) {
      return found
    }
  }

  const indexOfGtEq = version.indexOf('>=')
  if (indexOfGtEq >= 0) {
    let v = version.slice(indexOfGtEq + 2)
    const indexOfLt = v.indexOf('<')
    if (indexOfLt >= 0) {
      v = v.slice(0, indexOfLt)
    }
    const found = semver.parse(v, { loose: true })
    if (found && found.version) {
      return found.version
    }
  }

  let minVer
  try {
    semver.minVersion(version, { includePrerelease: true, loose: true })
  } catch (_error) {}

  const parsed = minVer || semver.parse(version, { loose: true }) || semver.coerce(version)

  return parsed && parsed.version
}

exports.semverToVersion = semverToVersion

function getMaxSemver(version, range) {
  if (typeof range !== 'string') {
    range = ''
  } else {
    range = range.trim()
  }

  version = semverToVersion(version)
  if (typeof version === 'string' && (version.startsWith('file:') || version === 'latest')) {
    return version
  }

  if (range) {
    if (range.startsWith('file:') || range === 'latest') {
      return range
    }

    const r = semverToVersion(range) || range
    if (typeof version === 'string') {
      try {
        if (semver.ltr(version, r, true)) {
          version = r
        }
      } catch (_error) {}
    } else if (r) {
      return r
    }
  }

  return version || null
}

exports.getMaxSemver = getMaxSemver

function inferPackageVersion(name, projectPackageJson) {
  let v

  if (projectPackageJson) {
    v = getMaxSemver(v, projectPackageJson.dependencies && projectPackageJson.dependencies[name])
    v = getMaxSemver(v, projectPackageJson.devDependencies && projectPackageJson.devDependencies[name])
    v = getMaxSemver(v, projectPackageJson.peerDependencies && projectPackageJson.peerDependencies[name])
    v = getMaxSemver(v, projectPackageJson.optionalDependencies && projectPackageJson.optionalDependencies[name])
  }

  v = getMaxSemver(v, referencePackageJson.dependencies && referencePackageJson.dependencies[name])
  v = getMaxSemver(v, referencePackageJson.devDependencies && referencePackageJson.devDependencies[name])
  v = getMaxSemver(v, referencePackageJson.peerDependencies && referencePackageJson.peerDependencies[name])

  if (!v) {
    if (name === referencePackageJson.name) {
      return referencePackageJson.version
    }
    return null
  }

  if (!v.startsWith('file:') && v !== 'latest' && nodeModules.hasLocalPackage(name)) {
    const pkgName = `${name}/package.json`
    let pkg
    try {
      pkg = require(pkgName)
    } catch (_error) {}
    if (pkg && pkg.version) {
      v = getMaxSemver(v, pkg.version)
    }
  }

  return v
}

exports.inferPackageVersion = inferPackageVersion

function addDevDependencies(projectPackageJson, listOfDependenciesToAdd) {
  let result = false

  for (const name of listOfDependenciesToAdd) {
    let v = inferPackageVersion(name, projectPackageJson)
    if (!v) {
      continue
    }

    if (semver.parse(v)) {
      v = `^${v}`
    }

    if (projectPackageJson.dependencies && projectPackageJson.dependencies[name]) {
      if (projectPackageJson.dependencies[name] !== v) {
        result = true
        projectPackageJson.dependencies[name] = v
      }
    } else if (!projectPackageJson.devDependencies || projectPackageJson.devDependencies[name] !== v) {
      result = true
      if (!projectPackageJson.devDependencies) {
        projectPackageJson.devDependencies = {}
      }
      projectPackageJson.devDependencies[name] = v
    }
  }
  return result
}

exports.addDevDependencies = addDevDependencies

function checkInstalledPackageVersion(version, expectedVersion) {
  if (typeof version !== 'string' || version.length === 0) {
    return false
  }
  expectedVersion = typeof expectedVersion === 'string' ? expectedVersion.trim() : ''
  if (expectedVersion === 'latest' || expectedVersion.startsWith('file:')) {
    return true
  }
  if (expectedVersion.length !== 0) {
    try {
      if (semver.ltr(version, expectedVersion)) {
        return false
      }
    } catch (_error) {}
    try {
      if (semver.ltr(semverToVersion(version), semverToVersion(expectedVersion))) {
        return false
      }
    } catch (_error) {}
  }
  return true
}

function isPackageInstalled(name, expectedVersion = null) {
  if (typeof name !== 'string' || name.length === 0) {
    return false
  }

  let pkg
  try {
    const pkgName = `${name}/package.json`
    let resolved

    if (!resolved) {
      const found = path.resolve(process.cwd(), 'node_modules', name, 'package.json')
      if (fileExists(found)) {
        resolved = found
      }
    }

    if (!resolved) {
      const found = path.resolve(process.cwd(), 'acuris-shared-component-tools', 'node_modules', name, 'package.json')
      if (fileExists(found)) {
        resolved = found
      }
    }

    for (const nodeModulesFolder of nodeModules.legacyNodeModulePaths(process.cwd())) {
      if (!nodeModules.isGlobalPath(nodeModulesFolder)) {
        const found = path.resolve(nodeModulesFolder, name, 'package.json')
        if (fileExists(found)) {
          resolved = found
          break
        }
      }
    }

    if (resolved) {
      pkg = require(resolved)
    }
  } catch (_error) {}

  if (checkInstalledPackageVersion(pkg && pkg.version, expectedVersion)) {
    return true
  }

  return false
}

exports.isPackageInstalled = isPackageInstalled

function getPackageJsonPath(cwd = process.cwd()) {
  return findUp('package.json', { directories: false, files: true, cwd }) || path.join(cwd, 'package.json')
}

exports.getPackageJsonPath = getPackageJsonPath

function readProjectPackageJson(packageJsonPath = getPackageJsonPath()) {
  if (!packageJsonPath) {
    return false
  }

  let manifest
  try {
    manifest = readTextFile(packageJsonPath, 'json-stringify')
  } catch (_error) {}

  return typeof manifest === 'object' && manifest !== null && !Array.isArray(manifest) ? manifest : undefined
}

exports.readProjectPackageJson = readProjectPackageJson

function hasPackagesToInstall(manifest = readProjectPackageJson()) {
  if (!manifest) {
    return false
  }

  const allDeps = new Map()

  for (const k of ['devDependencies', 'dependencies']) {
    const d = manifest[k]
    if (typeof d === 'object' && d !== null && !Array.isArray(d)) {
      for (const key of Object.keys(d)) {
        if (typeof d[key] === 'string') {
          allDeps.set(key, getMaxSemver(d[key], allDeps.get(key)) || d[key])
        }
      }
    }
  }

  for (const [name, version] of allDeps) {
    if (!isPackageInstalled(name, inferPackageVersion(name, manifest) || version)) {
      return true
    }
  }

  return false
}

exports.hasPackagesToInstall = hasPackagesToInstall

function getPackageManager(cwd = path.dirname(getPackageJsonPath())) {
  let yarnDate
  let packageLockDate
  try {
    const stats = fs.statSync(path.resolve(cwd, 'yarn.lock'))
    yarnDate = stats.isFile() && stats.mtimeMs
  } catch (_error) {}
  try {
    const stats = fs.statSync(path.resolve(cwd, 'package-lock.json'))
    packageLockDate = stats.isFile() && stats.mtimeMs
  } catch (_error) {}

  if (yarnDate > packageLockDate) {
    return 'yarn'
  }

  if (packageLockDate > yarnDate) {
    return 'npm'
  }

  return undefined
}

exports.getPackageManager = getPackageManager
