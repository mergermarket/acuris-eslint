#!/usr/bin/env node

const { name, version } = require('../package.json')

if ('CI' in process.env) {
  console.log(`\n  ${name} v${version}\n`)
} else {
  require('./lib/logo').printLogo()

  const chalk = require('chalk').default
  const x = chalk.reset(
    chalk.gray(
      `${chalk.cyan(name)} ${chalk.blueBright(`v${version}`)}

  Run ${chalk.yellow('acuris-eslint help')} to get help.
  Run ${chalk.yellow('acuris-eslint init')} to initialise a project.
  `
    )
  )
  console.log(x)
}
