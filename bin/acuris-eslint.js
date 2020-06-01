#!/usr/bin/env node
'use strict'

if (!global.__v8__compile__cache) {
  try {
    require('v8-compile-cache')
    global.__v8__compile__cache = true
  } catch (_) {}
}

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
  const options = new Set(
    [env.INIT_CWD, env.OLDPWD, cwd].filter((x) => typeof x === 'string' && x.length !== 0).map((x) => pathResolve(x))
  )
  for (const option of options) {
    tryPath(Module.createRequire(pathResolve(option, 'x')))
  }
  tryPath(require)

  if (bestRequire) {
    return bestRequire('@acuris/eslint-config/scripts/acuris-eslint.js')
  }

  return require('../scripts/acuris-eslint.js')

  function tryPath(doRequire) {
    try {
      const pkg = doRequire('@acuris/eslint-config/package.json')
      if (pkg.name === '@acuris/eslint-config' && semverCompare(pkg.version, bestManifest.version) >= 0) {
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
