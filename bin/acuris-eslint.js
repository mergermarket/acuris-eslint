#!/usr/bin/env node
'use strict'

try {
  require('v8-compile-cache')
  global.__v8__compile__cache = true
} catch (_error) {}

let resolved
try {
  resolved = require.resolve('../scripts/acuris-eslint')
} catch (_error) {}

require(resolved || '@eslint-config/scripts/acuris-eslint')
