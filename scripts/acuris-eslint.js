#!/usr/bin/env node

'use strict'

const path = require('path')

const argv = process.argv

const { eslintRequire } = require('../core/node-modules')

// To use V8's code cache to speed up instantiation time.
// eslint-disable-next-line node/no-extraneous-require
eslintRequire('v8-compile-cache')

function preinit() {
  const indexOfCwdOption = process.argv.indexOf('--cwd')
  if (indexOfCwdOption > 1) {
    process.chdir(process.argv[indexOfCwdOption + 1])
  }
  let cwdDir = null

  for (let i = 0, len = argv.length; i !== len; ++i) {
    const arg = argv[i]
    if (arg.startsWith('--cwd=')) {
      cwdDir = arg.slice('--cwd='.length).trim()
    } else if (arg === '--cwd') {
      cwdDir = (process.argv[i + 1] || '').trim()
    }
  }

  if (cwdDir) {
    process.chdir(cwdDir)
  }
}

// This must execute before everything else.
preinit()

const { version: packageVersion } = require('../package.json')

const programName = path.basename(__filename, '.js')

const chalk = require('chalk').default
if (chalk.enabled && chalk.supportsColor.hasBasic) {
  require('util').inspect.defaultOptions.colors = true
}

const appTitle = `${chalk.redBright('-')} ${chalk.greenBright(programName)} ${chalk.blueBright(`v${packageVersion}`)} `

console.time(appTitle)

const acurisEslintOptions = require('./lib/eslint-options')

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

if (options.help || options.commands || options.init) {
  require('./lib/logo').printLogo()
}

if (options.help || options.commands) {
  console.info(appTitle)
  console.info(acurisEslintOptions.generateHelp({ showCommandsOnly: options.commands }))
} else if (!options.command) {
  try {
    if (options.canLog) {
      console.info(appTitle)
    }
    eslintRequire('./bin/eslint')
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
