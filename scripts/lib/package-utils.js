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

  return manifest
}

exports.sanitisePackageJson = sanitisePackageJson
