#!/usr/bin/env node
'use strict'

const path = require('path')

// This must execute before everything else.
initCwd()

function initCwd() {
  const indexOfCwdOption = process.argv.indexOf('--cwd')
  if (indexOfCwdOption > 1) {
    process.chdir(process.argv[indexOfCwdOption + 1])
  }
  let argIndex = 0
  for (const arg of process.argv) {
    if (arg.startsWith('--cwd=')) {
      process.chdir(arg.slice('--cwd='.length))
      console.log(process.cwd())
    } else if (arg === '--cwd') {
      process.chdir(process.argv[argIndex + 1])
      console.log(process.cwd())
    }
    ++argIndex
  }
}

const chalk = require('chalk').default
if (chalk.enabled && chalk.supportsColor.hasBasic) {
  require('util').inspect.defaultOptions.colors = true
}

const { version: packageVersion } = require('../package.json')

const programName = path.basename(__filename, '.js')

const appTitle = `${chalk.redBright('-')} ${chalk.greenBright(programName)} ${chalk.blueBright(`v${packageVersion}`)} `

console.time(appTitle)

const acurisEslintOptions = require('./lib/eslint-options')

const argv = process.argv

let options
try {
  options = acurisEslintOptions.parse(argv)
} catch (error) {
  if (error && error.message && error.name === 'Error') {
    console.error(`\n${chalk.redBright(`Error: ${error.message}`)}\n`)
    console.error(`${chalk.yellowBright(`  run ${chalk.bold(`${programName} --help`)} for additional options`)}\n`)
  } else {
    throw error
  }
  return
}

if (options.help) {
  console.info(appTitle)
  console.info(acurisEslintOptions.generateHelp())
} else if (!options.command) {
  try {
    if (options.canLog) {
      console.info(appTitle)
    }
    require('eslint/bin/eslint')
  } finally {
    if (options.canLog) {
      setTimeout(() => {
        console.timeEnd(appTitle)
      }, 0)
    }
  }
} else {
  console.info(`\n${appTitle}${chalk.yellowBright(options.commandName)}\n`)

  if (!options.command.name || options.command.name === 'exports') {
    Object.defineProperty(options.command, 'name', { value: options.commandName, configurable: true })
  }

  const handleCommandError = error => {
    if (!process.exitCode) {
      process.exitCode = 1
    }
    console.log()
    console.error(error)
    try {
      require('./lib/notes').flushNotes()
    } catch (_error) {}
  }

  try {
    const commandResult = options.command(options)
    if (commandResult && typeof commandResult.then === 'function' && typeof commandResult.catch === 'function') {
      commandResult
        .then(() => {
          require('./lib/notes').flushNotes()
          console.log()
        })
        .catch(handleCommandError)
    }
  } catch (error) {
    handleCommandError(error)
  }
}
