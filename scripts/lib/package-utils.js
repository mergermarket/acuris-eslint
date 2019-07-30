const path = require('path')
const nodeModules = require('../../core/node-modules')
const { getRepositoryFromGitConfig, fileExists } = require('./fs-utils')
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
      result.add(manifest.name)
    }
    addObjectKeysToSet(result, referencePackageJson.peerDependencies)

    if (hasDep('@babel/runtime')) {
      result.add('babel-eslint')
    }

    if (hasDep('typescript') || fileExists(path.resolve(cwd, 'tsconfig.json'))) {
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

  if (version.startsWith('file:')) {
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
  if (typeof version === 'string' && version.startsWith('file:')) {
    return version
  }

  if (range) {
    if (range.startsWith('file:')) {
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
    return null
  }

  if (!v.startsWith('file:') && nodeModules.hasLocalPackage(name)) {
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

function isPackageInstalled(name, version = null) {
  if (typeof name !== 'string' || name.length === 0) {
    return false
  }

  const pkgName = `${name}/package.json`
  if (!nodeModules.hasLocalPackage(pkgName)) {
    return false
  }
  let pkg
  try {
    pkg = require(pkgName)
  } catch (_error) {}

  if (!pkg || !pkg.version) {
    return false
  }

  version = typeof version === 'string' ? version.trim() : ''
  if (version.length !== 0 && !version.startsWith('file:')) {
    try {
      if (semver.ltr(pkg.version, version)) {
        return false
      }
    } catch (_error) {
      console.log(_error)
    }
    try {
      if (semver.ltr(semverToVersion(pkg.version), semverToVersion(version))) {
        return false
      }
    } catch (_error) {
      console.log(_error)
    }
    return true
  }

  return true
}

exports.isPackageInstalled = isPackageInstalled

function hasPackagesToInstall(manifest) {
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
