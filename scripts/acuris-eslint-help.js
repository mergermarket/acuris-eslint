#!/usr/bin/env node
'use strict'

module.exports = {
  printLogo,
  printAcurisEslintHelp,
  printAcurisEslintCommands,
  printVersion,
  printSysInfo,
  printAcurisEslintOptionsParseError
}

function printLogo(reason) {
  if (process.env.ACURIS_ESLINT_LOGO_PRINTED || process.env.ACURIS_ESLINT_RUN_ASYNC === 'Y') {
    return
  }
  process.env.ACURIS_ESLINT_LOGO_PRINTED = true
  const { name, version, homepage } = require('../package.json')
  const chalk = require('chalk')

  if (chalk.level >= 2 && canPrintUtf8Logo()) {
    const logo = chalk.redBright(`
  ⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣶⡄
  ⠀⠀⠀⠀⠀⠀⠀⠀⢀⣾⣿⣿⡄
  ⠀⠀⠀⠀⠀⠀⠀⢀⣾⣿⣿⣿⣿⡄
  ⠀⠀⠀⠀⠀⠀⢀⣾⣿⣿⠛⢿⣿⣿⡄
  ⠀⠀⠀⠀⠀⢀⣾⣿⡿⠃⠀⠈⢻⣿⣿⡄
  ⠀⠀⠀⠀⢀⣾⣿⡿⠁⠀⠀⠀⠀⢻⣿⣿⡄⠀⠀⠀⠀⠀⠀${chalk.gray('A c u r i s')}
  ⠀⠀⠀⢀⣾⣿⡟⠁⠀⢀⣠⡀⠀⠀⠹⣿⣿⡄
  ⠀⠀⢀⣾⣿⡏⣀⣤⣾⣿⠿⣿⣷⣦⣄⠹⣿⣿⡄
  ⠀⢀⣾⣿⣿⣿⣿⠟⠋⠁⠀⠀⠙⠻⢿⣿⣿⣿⣿⡄
  ⢀⣾⣿⣿⠟⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠻⢿⣿⣿⡄
  ⠾⠛⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠙⠿

`)
    process.stdout.write(logo)
  }
  console.log(`${chalk.redBright('-')} ${chalk.greenBright(name)} ${chalk.blueBright(`v${version}`)}`)
  console.log(`  ${chalk.underline.blue(homepage)}\n`)

  if (reason === 'postinstall') {
    const text = chalk.reset(
      chalk.gray(`
  Run ${chalk.yellow('acuris-eslint')} ${chalk.yellowBright('--help')} to get help.
  Run ${chalk.yellow('acuris-eslint')} ${chalk.yellowBright('--commands')} to list available commands.
  Run ${chalk.yellow('acuris-eslint')} ${chalk.yellowBright('--init')} to initialise a project.
  Run ${chalk.yellow('acuris-eslint')} ${chalk.yellowBright('--update')} to update acuris-eslint and all dependencies.
  `)
    )
    console.log(text)
  }
}

function canPrintUtf8Logo() {
  if ('CI' in process.env || process.env.ACURIS_ESLINT_RUN_ASYNC === 'Y') {
    return false
  }

  const columns = (process.stdout && process.stdout.isTTY && process.stdout.columns) || 0
  if (columns < 34) {
    return false
  }

  const os = require('os')
  if (os.type() === 'Windows_NT') {
    return false
  }

  const isUTF8 = /UTF-?8$/i
  const ctype = process.env.LC_ALL || process.env.LC_CTYPE || process.env.LANG
  if (!isUTF8.test(ctype)) {
    return false
  }

  return true
}

function printAcurisEslintOptionsParseError(error, programName) {
  const chalk = require('chalk')
  if (error && error.message && error.name === 'Error') {
    console.error(`\n${chalk.redBright(`Error: ${error.message}`)}\n`)
    console.error(`${chalk.yellowBright(`  run ${chalk.bold(`${programName} --help`)} for additional options`)}\n`)
  } else {
    throw error
  }
}

function printAcurisEslintHelp() {
  const chalk = require('chalk')
  const { getProgramName, createCmdOptionsHelp } = require('./lib/cmd-options-help')

  const programName = getProgramName()
  printLogo()

  console.log(`${chalk.whiteBright(programName)} [options] [file.js] [dir]`)
  console.log(`  ${chalk.cyan('lints the current folder or the given files')}\n`)

  const optHelp = createCmdOptionsHelp(programName)
  const { acurisEslintOptions } = require('./lib/acuris-eslint-options')
  acurisEslintOptions(optHelp)
  console.log(optHelp.getHelp())
}

function printAcurisEslintCommands() {
  const { createCmdOptionsHelp } = require('./lib/cmd-options-help')

  printLogo()

  const optHelp = createCmdOptionsHelp()

  const { acurisEslintOptions } = require('./lib/acuris-eslint-options')
  acurisEslintOptions(optHelp)
  console.log(optHelp.getCommandsHelp())
}

function printVersion() {
  console.log(`v${require('../package.json').version}`)
}

function printSysInfo() {
  const { getEslintVersion } = require('../core/node-modules')
  const eslintSupport = require('../core/eslint-support')
  const manifest = require('../package.json')
  const os = require('os')

  const cpus = os.cpus()
  const env = {
    node: process.version,
    V8: process.versions.v8,
    platform: `${os.type()} ${os.release()} ${process.arch}`,
    CPU: `${(cpus[0] && cpus[0].model) || '<unknown>'}, ${cpus.length} cores.`,
    memory: `${(os.totalmem() / 1073741824).toFixed(2)} GB`
  }

  const versions = {
    node: process.version,
    [manifest.name]: manifest.version
  }

  try {
    versions.eslint = getEslintVersion()
  } catch (_error1) {}

  const names = new Set()
  names.add('react')

  function addDepNames(obj) {
    if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
      for (const key of Object.keys(obj)) {
        names.add(key)
      }
    }
  }

  addDepNames(manifest.peerDependencies)
  addDepNames(manifest.devDependencies)

  const dependencies = {}
  for (const name of Array.from(names).sort()) {
    if (name !== 'eslint') {
      const p = `${name}/package.json`
      try {
        dependencies[name] = require(p).version
      } catch (_error0) {}
    }
  }

  const info = {
    versions,
    dependencies,
    env,
    support: JSON.parse(JSON.stringify(eslintSupport))
  }

  console.log(JSON.stringify(info, null, 2))
}

if (process.mainModule === module) {
  const argv = process.argv || []
  if (argv.indexOf('--commands') > 0) {
    printAcurisEslintCommands()
  } else if (argv.indexOf('--logo') > 0) {
    printLogo()
  } else if (argv.indexOf('--sys-info') > 0) {
    printSysInfo()
  } else if (argv.indexOf('--version') > 0) {
    printVersion()
  } else {
    printAcurisEslintHelp()
  }
}
