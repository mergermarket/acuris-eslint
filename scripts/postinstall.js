#!/usr/bin/env node

const { name, version, homepage } = require('../package.json')
const path = require('path')
const fs = require('fs')

if ('CI' in process.env || process.env.ACURIS_ESLINT_RUN_ASYNC === 'Y') {
  console.log(`\n  ${name} v${version}\n`)
} else {
  require('./lib/logo').printLogo()

  const chalk = require('chalk')

  const text = chalk.reset(
    chalk.gray(
      `${chalk.cyan(name)} ${chalk.blueBright(`v${version}`)}

  Run ${chalk.yellow('acuris-eslint')} ${chalk.yellowBright('--help')} to get help.
  Run ${chalk.yellow('acuris-eslint')} ${chalk.yellowBright('--commands')} to list available commands.
  Run ${chalk.yellow('acuris-eslint')} ${chalk.yellowBright('--init')} to initialise a project.
  Run ${chalk.yellow('acuris-eslint')} ${chalk.yellowBright('--update')} to update acuris-eslint and all dependencies.

  ${chalk.blue(homepage)}
  `
    )
  )
  console.log(text)

  const eslintCachePath = path.resolve(process.cwd(), '.eslintcache')
  if (fs.existsSync(eslintCachePath)) {
    const clearCache = require('./commands/clear-cache')
    clearCache({
      cacheLocation: '.eslintcache'
    })
  }
}
