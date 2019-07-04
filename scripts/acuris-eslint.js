#!/usr/bin/env node
'use strict'

require('../core/checkNodeVersion')

const path = require('path')
const chalk = require('chalk').default
const { version: packageVersion } = require('../package.json')

const programName = path.basename(__filename, '.js')

const appTitle = `${chalk.redBright('-')} ${chalk.greenBright(programName)} ${chalk.blueBright(`v${packageVersion}`)} `

console.time(appTitle)

const acurisEslintOptions = require('./lib/eslint-options')

const argv = process.argv

let options
try {
  options = acurisEslintOptions.parse(argv)
} catch (_error) {
  options = { canLog: true }
}

if (!options.command) {
  try {
    if (options.canLog) {
      console.info(appTitle)
    }
    require('eslint/bin/eslint')
  } finally {
    if (options.canLog) {
      console.timeEnd(appTitle)
    }
  }
} else {
  console.info(`${appTitle}${chalk.yellowBright(options.commandName)}`)

  if (!options.command.name || options.command.name === 'exports') {
    Object.defineProperty(options.command, 'name', { value: options.commandName, configurable: true })
  }

  const handleCommandError = error => {
    if (!process.exitCode) {
      process.exitCode = 1
    }
    console.error(error)
  }

  try {
    const commandResult = options.command(options)
    if (commandResult && typeof commandResult.then === 'function' && typeof commandResult.catch === 'function') {
      commandResult
        .then(() => {
          console.timeEnd(appTitle)
        })
        .catch(handleCommandError)
    } else {
      console.timeEnd(appTitle)
    }
  } catch (error) {
    handleCommandError(error)
  }
}
