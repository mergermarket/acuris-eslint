#!/usr/bin/env node
'use strict'

try {
  require('v8-compile-cache')
  global.__v8__compile__cache = true
} catch (_error) {}

const fs = require('fs')
const os = require('os')
const path = require('path')

const cwd = process.cwd() || ''
const initCwd = process.env.INIT_CWD || ''

const resolved =
  searchFile(cwd, 'node_modules/@acuris/acuris-eslint/scripts/acuris-eslint.js') ||
  searchFile(cwd !== initCwd && initCwd, 'node_modules/@acuris/acuris-eslint/scripts/acuris-eslint.js') ||
  (cwd.endsWith('acuris-eslint') && searchFile(cwd, 'scripts/acuris-eslint.js')) ||
  resolveFile('../scripts/acuris-eslint.js') ||
  '@acuris/eslint-config/scripts/acuris-eslint.js'

const fn = require(resolved)
if (typeof fn === 'function') {
  fn(process.argv)
}

function searchFile(dir, name) {
  if (!dir) {
    return ''
  }
  for (;;) {
    const resolvedPath = path.resolve(dir, name)
    if (fs.existsSync(resolvedPath)) {
      return resolvedPath
    }
    const parent = path.dirname(dir) || ''
    if (parent.length === dir.length || parent === os.homedir()) {
      break
    }
    dir = parent
  }
  return ''
}

function resolveFile(id) {
  try {
    return require.resolve(id)
  } catch (_error) {}
  return ''
}
