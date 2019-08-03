#!/usr/bin/env node

'use strict'

const path = require('path')
const fs = require('fs')

let debugEnabled = false
//const useStdIn = process.argv.indexOf('--stdin') > -1
//const debug = process.argv.indexOf('--debug') > -1

function preinit() {
  const indexOfCwdOption = process.argv.indexOf('--cwd')
  if (indexOfCwdOption > 1) {
    process.chdir(process.argv[indexOfCwdOption + 1])
  }
  let cwdDir = null

  const argv = process.argv
  for (let i = 0, len = argv.length; i !== len; ++i) {
    const arg = argv[i]
    if (arg.startsWith('--cwd=')) {
      cwdDir = arg.slice('--cwd='.length).trim()
    } else if (arg === '--cwd') {
      cwdDir = (process.argv[i + 1] || '').trim()
    } else if (arg === '--debug') {
      debugEnabled = true
    } else if (arg === '--no-debug') {
      debugEnabled = false
    }
  }

  if (cwdDir) {
    process.chdir(cwdDir)
  }
}

// This must execute before everything else.
preinit()

const { eslintRequire, getEslintPath } = require('../core/node-modules')

eslintRequire('v8-compile-cache')

if (debugEnabled) {
  eslintRequire('debug').enable('eslint:*,-eslint:code-path')
}

const { version: packageVersion } = require('../package.json')
const eslintPath = getEslintPath()
const chalk = require('chalk').default
const programName = path.basename(process.argv[1], '.js')

const appTitle = `${chalk.redBright('-')} ${chalk.greenBright(programName)} ${chalk.blueBright(`v${packageVersion}`)}`

console.time(appTitle)

if (chalk.enabled && chalk.supportsColor.hasBasic) {
  require('util').inspect.defaultOptions.colors = true
}

const acurisEslintOptions = require('./lib/eslint-options')
const options = acurisEslintOptions.tryParse(process.argv)

if (!options) {
  if (!process.exitCode) {
    process.exitCode = 1
  }
} else if (options.help || options.commands) {
  require('./lib/logo').printLogo()
  console.error(appTitle)
  console.error(acurisEslintOptions.generateHelp({ showCommandsOnly: options.commands }))
} else if (options.commandName) {
  const runCommand = require('./lib/run-command')
  runCommand(options, appTitle)
} else {
  process.once('uncaughtException', handleEslintError)
  if (options.canLog) {
    console.info(appTitle)
  }
  let exitCode = 1
  try {
    exitCode = eslint()
  } catch (error) {
    handleEslintError(error)
  } finally {
    if (options.canLog) {
      setTimeout(function timeEnd() {
        console.timeEnd(appTitle)
      }, 0)
    }
    if (exitCode && !process.exitCode) {
      process.exitCode = exitCode
    }
  }
}

function filterEslintWarnings(report) {
  let filtered = null
  const results = report.results
  for (let i = 0, len = results.length; i !== len; ++i) {
    const item = results[i]
    if (item.warningCount === 1 && item.errorCount === 0) {
      const messages = item.messages
      if (messages && messages.length === 1) {
        const msg = messages[0]
        if (msg.message === 'File ignored because of a matching ignore pattern. Use "--no-ignore" to override.') {
          --report.warningCount
          if (filtered === null) {
            filtered = results.slice(0, i)
            report.results = filtered
          }
          continue
        }
      }
    }
    if (filtered !== null) {
      filtered.push(item)
    }
  }
}

function eslint() {
  const { CLIEngine } = eslintRequire('./lib/cli-engine')
  const engine = new CLIEngine(acurisEslintOptions.translateOptionsForCLIEngine(options))

  if (options.printConfig) {
    const fileConfig = engine.getConfigForFile(options.printConfig)
    console.info(JSON.stringify(fileConfig, null, 2))
    return 0
  }

  const files = options._

  const report = options.stdin
    ? engine.executeOnText(fs.readFileSync(0, 'utf8'), options.stdinFilename, false)
    : engine.executeOnFiles(files)

  if (options.fix) {
    // Fix mode enabled - applying fixes
    CLIEngine.outputFixes(report)
  }

  if (options.quiet) {
    // Quiet mode enabled - filtering out warnings
    report.results = CLIEngine.getErrorResults(report.results)
  } else {
    filterEslintWarnings(report)
  }

  if (printEslintResults(engine, report.results, options.format, options.outputFile)) {
    const tooManyWarnings = options.maxWarnings >= 0 && report.warningCount > options.maxWarnings

    if (!report.errorCount && tooManyWarnings) {
      console.error(chalk.redBright('ESLint found too many warnings (maximum: %s).\n'), options.maxWarnings)
    }

    return report.errorCount || tooManyWarnings ? 1 : 0
  }
  return 2
}

function printEslintResults(engine, results, format, outputFile) {
  let formatter
  try {
    formatter = engine.getFormatter(format)
  } catch (error) {
    console.error(chalk.redBright(error))
    return false
  }

  const rulesMetaProvider = {}
  Object.defineProperty(rulesMetaProvider, 'rulesMeta', {
    get() {
      const value = {}
      Object.defineProperty(this, 'rulesMeta', { value })
      for (const [k, rule] of engine.getRules()) {
        value[k] = rule.meta
      }
      return value
    }
  })

  const output = formatter(results, rulesMetaProvider)
  if (!output) {
    return true
  }

  if (outputFile) {
    const filePath = path.resolve(process.cwd(), outputFile)

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      console.error(chalk.redBright('Cannot write to output file path, it is a directory: %s'), outputFile)
      return false
    }

    try {
      require('mkdirp').sync(path.dirname(filePath))
      fs.writeFileSync(filePath, output)
    } catch (ex) {
      console.error(chalk.redBright('There was a problem writing the output file:\n%s'), ex)
      return false
    }
    return true
  }

  console.info(output)
  return true
}

function handleEslintError(error) {
  if (!error) {
    error = new Error(`${programName} failed`)
  }

  console.error(chalk.redBright('\nOops! Something went wrong! :('))

  if (eslintPath && typeof error.messageTemplate === 'string' && error.messageTemplate.length > 0) {
    try {
      const template = eslintRequire('lodash').template(
        fs.readFileSync(path.resolve(eslintPath, `./messages/${error.messageTemplate}.txt`), 'utf-8')
      )
      let eslintVersion
      try {
        eslintVersion = eslintRequire('./package.json').version
      } catch (_error) {}
      console.error(`\nESLint: ${eslintVersion || '<not found>'}.\n\n${template(error.messageData || {})}`)
    } catch (_error) {
      console.error(error.stack)
    }
  } else {
    console.error(error)
  }

  if (!process.exitCode) {
    process.exitCode = 2
  }
}
