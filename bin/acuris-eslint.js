#!/usr/bin/env node
'use strict'

const path = require('path')
const Module = require('module')
const manifest = require('../package.json')

if (!Module.createRequire || Number.parseFloat(process.versions) < 12) {
  throw new Error(
    ['Node version ', process.version, ' is incompatible with acuris-eslint. Install a newer node version.'].join()
  )
} else {
  const fn = loadBestVersion()
  if (typeof fn === 'function') {
    fn(process.argv)
  }
}

try {
  require('v8-compile-cache')
  global.__v8__compile__cache = true
} catch (_error) {}

function loadBestVersion() {
  const cwd = process.cwd()

  const runningPackagePath = path.dirname(__dirname)
  if (runningPackagePath === cwd) {
    return require('../scripts/acuris-eslint.js')
  }

  let bestManifest = manifest
  let bestRequire

  const env = process.env
  const pathResolve = path.resolve
  const options = new Set([cwd, env.INIT_CWD, env.OLDPWD].filter(Boolean).map((x) => pathResolve(x)))
  for (const option of options) {
    tryRequire(Module.createRequire(pathResolve(option, 'x')))
  }
  tryRequire(require)

  if (bestRequire) {
    return bestRequire('@acuris/acuris-eslint/scripts/acuris-eslint.js')
  }

  return require('../scripts/acuris-eslint.js')

  function tryRequire(doRequire) {
    try {
      const pkg = doRequire('@acuris/eslint-config/package.json')
      if (semverCompare(pkg.version, bestManifest.version) > 0 && pkg.name === bestManifest.name) {
        bestManifest = pkg
        bestRequire = doRequire
      }
    } catch (_) {}
  }
}

function semverCompare(a, b) {
  const pa = a.split('.')
  const pb = b.split('.')
  for (let i = 0; i < 3; i++) {
    const na = parseInt(pa[i])
    const nb = parseInt(pb[i])
    if (na > nb) {
      return 1
    }
    if (nb > na) {
      return -1
    }
    if (!isNaN(na) && isNaN(nb)) {
      return 1
    }
    if (isNaN(na) && !isNaN(nb)) {
      return -1
    }
  }
  return pa.length - pb.length
}
