const { eslintRequire } = require('../../core/node-modules')
const manifest = require('../../package.json')

module.exports = function() {
  const versions = {
    [manifest.name]: manifest.version
  }

  try {
    versions.eslint = eslintRequire('./package.json').version
  } catch (_error1) {}

  const names = new Set()
  names.add('react')

  function addDepNames(obj) {
    if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
      for (const key of Object.keys(obj)) {
        names.add(key)
      }
    }
  }

  addDepNames(manifest.peerDependencies)
  addDepNames(manifest.devDependencies)

  const plugins = {}
  for (const name of Array.from(names).sort()) {
    if (name !== 'eslint') {
      const p = `${name}/package.json`
      try {
        plugins[name] = require(p).version
      } catch (_error0) {}
    }
  }

  versions.plugins = plugins

  console.log(JSON.stringify(versions, null, 2))
}
