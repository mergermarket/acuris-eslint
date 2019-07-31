const manifest = require('../../package.json')
const { eslintRequire } = require('../../core/node-modules')

module.exports = function() {
  const versions = {
    [manifest.name]: manifest.version
  }

  try {
    versions.eslint = eslintRequire('./package.json').version
  } catch (_error1) {}

  const allDeps = new Set()

  function addDepNames(obj) {
    if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
      for (const key of Object.keys(obj)) {
        allDeps.add(key)
      }
    }
  }

  addDepNames(manifest.peerDependencies)
  addDepNames(manifest.devDependencies)

  const plugins = {}
  for (const name of Array.from(allDeps).sort()) {
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
