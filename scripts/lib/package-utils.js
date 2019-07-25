const referencePackageJson = require('../../package.json')

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

  sortPackageJson(manifest)

  return manifest
}

exports.sanitisePackageJson = sanitisePackageJson

function sortPackageJson(manifest) {
  const map = new Map()

  const packageJsonSortOrder = getPackageJsonSortOrder()
  for (const key of packageJsonSortOrder) {
    if (manifest[key] !== undefined) {
      map.set(key, manifest[key])
    }
  }
  for (const key of Object.keys(manifest)) {
    if (manifest[key] !== undefined) {
      map.set(key, manifest[key])
      delete manifest[key]
    }
  }

  for (const [key, value] of map) {
    manifest[key] = value
  }

  return map
}

exports.sortPackageJson = sortPackageJson

function getPackageJsonSortOrder() {
  return new Set([
    'name',
    'version',
    'private',
    'description',
    'keywords',
    'homepage',
    'bugs',
    'repository',
    'license',
    'author',
    'contributors',
    'os',
    'cpu',
    'engines',
    'engineStrict',
    'sideEffects',
    'main',
    'umd:main',
    'type',
    'types',
    'typings',
    'bin',
    'browser',
    'files',
    'directories',
    'unpkg',
    'module',
    'source',
    'jsnext:main',
    'style',
    'example',
    'examplestyle',
    'assets',
    'man',
    'workspaces',
    'scripts',
    'betterScripts',
    'husky',
    'pre-commit',
    'commitlint',
    'lint-staged',
    'config',
    'nodemonConfig',
    'browserify',
    'babel',
    'browserslist',
    'xo',
    'prettier',
    'eslintConfig',
    'eslintIgnore',
    'stylelint',
    'jest',
    'flat',
    'resolutions',
    'preferGlobal',
    'publishConfig',
    'dependencies',
    'peerDependencies',
    'devDependencies',
    'bundledDependencies',
    'bundleDependencies',
    'optionalDependencies'
  ])
}
