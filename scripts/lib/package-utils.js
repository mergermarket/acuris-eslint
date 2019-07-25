const nodeModules = require('../../core/node-modules')
const referencePackageJson = require('../../package.json')
const { fileExists, resolveProjectFile } = require('./fs-utils')
const semver = require('semver')

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

  const indexOfLtEq = version.indexOf('<=')
  if (indexOfLtEq > 0) {
    const found = semverToVersion(version.slice(indexOfLtEq + 2))
    if (found) {
      return found
    }
  }

  const parsed =
    semver.minVersion(version, { includePrerelease: true, loose: true }) ||
    semver.parse(version, { loose: true }) ||
    semver.coerce(version)

  return parsed && parsed.version
}

exports.semverToVersion = semverToVersion

function getMaxSemver(version, range) {
  if (typeof range !== 'string') {
    return version
  }
  range = range.trim()
  if (range.length === 0) {
    return version
  }
  if (range.startsWith('file:')) {
    return range
  }
  try {
    if (!semver.gtr(version, range, true)) {
      const v = semverToVersion(range)
      return v ? (/^\d/.test(v) ? `^${v}` : v) : range
    }
  } catch (_error) {}
  try {
    if (!semver.gtr(semver.coerce(version), semver.coerce(range), true)) {
      const v = semverToVersion(range)
      return v ? (/^\d/.test(v) ? `^${v}` : v) : range
    }
  } catch (_error) {}
  return version
}

exports.getMaxSemver = getMaxSemver

function addDevDependencies(target, dependenciesToAdd) {
  let result = false
  const deps = dependenciesToMap(target.dependencies)
  const devDeps = dependenciesToMap(target.devDependencies)
  const sourceDeps = dependenciesToMap(dependenciesToAdd)
  for (const [name, value] of sourceDeps) {
    const version = semverToVersion(value)
    if (version) {
      let v = version
      const dep = deps.get(name)
      const devDep = devDeps.get(name)
      v = getMaxSemver(v, dep)
      v = getMaxSemver(v, devDep)
      if (dep !== undefined && dep !== v) {
        result = true
        target.dependencies[name] = v
      } else if (devDep !== v) {
        result = true
        if (!target.devDependencies) {
          target.devDependencies = {}
        }
        target.devDependencies[name] = v
      }
    }
  }
  return result
}

exports.addDevDependencies = addDevDependencies

function dependenciesToMap(dependencies, result = new Map()) {
  if (typeof dependencies === 'object' && dependencies !== null && !Array.isArray(dependencies)) {
    for (const key of Object.keys(dependencies)) {
      if (typeof dependencies[key] === 'string') {
        result.set(key, dependencies[key])
      }
    }
  }
  return result
}

function hasPackagesToInstall(manifest) {
  const allDeps = dependenciesToMap(manifest.devDependencies)
  dependenciesToMap(manifest.dependencies, allDeps)

  for (const [name, version] of allDeps) {
    if (!isPackageInstalled(name, version)) {
      return true
    }
  }
  return false
}

function isPackageInstalled(name, version) {
  if (typeof name !== 'string' || typeof version !== 'string') {
    return false
  }
  name = name.trim()
  version = version.trim()

  if (name.length === 0 || version.length === 0) {
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

  if (version.startsWith('file:')) {
    return true // Skip this check, is a complicated case.
  }

  try {
    if (semver.ltr(pkg.version, version)) {
      return false
    }
  } catch (_error) {
    return false
  }

  return true
}

exports.hasPackagesToInstall = hasPackagesToInstall
