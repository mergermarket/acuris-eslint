#!/usr/bin/env node

'use strict'

let resolved
try {
  resolved = require.resolve('../scripts/acuris-eslint')
} catch (_error) {}

require(resolved || '@eslint-config/scripts/acuris-eslint')
