#!/usr/bin/env node

const { name, version } = require('../package.json')
const path = require('path')
const fs = require('fs')

if ('CI' in process.env || process.env.ACURIS_ESLINT_RUN_ASYNC === 'Y') {
  console.log(`\n- ${name} v${version}\n`)
} else {
  require('./acuris-eslint-help').printLogo('postinstall')
  const eslintCacheLocation = path.resolve(process.env.INIT_CWD || process.cwd(), '.eslintcache')
  const prettierCacheLocation = path.resolve(process.env.INIT_CWD || process.cwd(), '.prettiercache')
  if (fs.existsSync(eslintCacheLocation) || fs.existsSync(prettierCacheLocation)) {
    const clearCache = require('./commands/clear-cache')
    clearCache({ cacheLocation: '.eslintcache' })
  }
}
