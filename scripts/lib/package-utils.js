function sanitisePackageJson(manifest) {
  manifest = JSON.parse(JSON.stringify(manifest))

  if (typeof manifest !== 'object' || manifest === null || Array.isArray(manifest)) {
    throw new Error('package.json must be an object')
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
  if (!manifest.engines) {
    manifest.engines = {}
  }
  if (typeof manifest.engines === 'object' && !manifest.engines.node) {
    manifest.engines.node = '>=8.10.0'
  }

  return manifest
}

exports.sanitisePackageJson = sanitisePackageJson
