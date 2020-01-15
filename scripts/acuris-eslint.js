#!/usr/bin/env node
'use strict'

if (!global.__v8__compile__cache) {
  require('v8-compile-cache')
}

const path = require('path')
const fs = require('fs')

let timerStarted = false

const { tryParseAcurisEslintOptions, translateOptionsForCLIEngine } = require('./lib/acuris-eslint-options')

const cliOptions = tryParseAcurisEslintOptions()

const options = (cliOptions && cliOptions.options) || {}

if (options.cwd) {
  process.chdir(path.resolve(cliOptions.cwd))
}

const { eslintRequire, eslintTryRequire, getEslintVersion, assertEslintVersion } = require('../core/node-modules')

const { version: packageVersion } = require('../package.json')

if (options.debug) {
  const eslintDebug = eslintTryRequire('debug')
  if (eslintDebug) {
    eslintDebug.enable('eslint:*,-eslint:code-path')
  }
}

const chalk = require('chalk')

let _handledErrors
process.on('uncaughtException', handleError)

if (chalk.level > 0) {
  require('util').inspect.defaultOptions.colors = true
}

if (!cliOptions) {
  if (!process.exitCode) {
    process.exitCode = 1
  }
} else if (cliOptions.command !== undefined) {
  require('./lib/run-command')(cliOptions)
} else {
  const appTitle = `${chalk.redBright('-')} ${chalk.greenBright(cliOptions.programName)} ${chalk.blueBright(
    `v${packageVersion}`
  )}`

  if (cliOptions.canLog) {
    console.info(appTitle)
    console.time(appTitle)
    timerStarted = appTitle
  }

  const exitCode = eslint()
  endTimeLog()
  if (exitCode && !process.exitCode) {
    process.exitCode = exitCode
  }
}

function eslint() {
  const stopFsCache = require('./lib/fs-cache').startFsCache().stop

  assertEslintVersion()
  const { CLIEngine } = eslintRequire('./lib/cli-engine')

  const engine = new CLIEngine(translateOptionsForCLIEngine(cliOptions))

  let report
  try {
    report = options.stdin
      ? engine.executeOnText(fs.readFileSync(0, 'utf8'), options.stdinFilename, false)
      : engine.executeOnFiles(cliOptions.list)
  } finally {
    stopFsCache()
  }

  if (options.fix) {
    // Fix mode enabled - applying fixes
    CLIEngine.outputFixes(report)
  }

  if (options.quiet) {
    // Quiet mode enabled - filtering out warnings
    report.results = CLIEngine.getErrorResults(report.results)
  } else {
    filterOutEslintWarnings(report)
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
  Reflect.defineProperty(rulesMetaProvider, 'rulesMeta', {
    get() {
      const value = {}
      Reflect.defineProperty(this, 'rulesMeta', { value })
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
      require('./lib/fs-utils').mkdirSync(path.dirname(filePath))
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

function endTimeLog() {
  const msg = timerStarted
  if (msg) {
    timerStarted = false
    setImmediate(() => {
      const exitCode = process.exitCode
      console.timeLog(msg, exitCode ? chalk.redBright(`exit code ${exitCode}`) : chalk.greenBright('ok'))
    })
  }
}

function handleError(error) {
  if (!_handledErrors) {
    _handledErrors = new WeakSet()
  } else if (_handledErrors.has(error)) {
    return
  }
  _handledErrors.add(error)

  if (!process.exitCode) {
    process.exitCode = 2
  }
  endTimeLog()
  if (!error) {
    error = new Error(`${cliOptions.programName} failed`)
  }
  console.error(chalk.redBright('\nOops! Something went wrong! :(\n'))
  if (typeof error.messageTemplate === 'string' && error.messageTemplate.length > 0) {
    try {
      const eslintPath = path.dirname(require.resolve('eslint/package.json'))
      const template = eslintRequire('lodash').template(
        fs.readFileSync(path.resolve(eslintPath, `./messages/${error.messageTemplate}.txt`), 'utf-8')
      )
      console.error(`\nESLint: ${getEslintVersion() || '<not found>'}.\n\n${template(error.messageData || {})}`)
      return
    } catch (_error) {}
  }
  console.error(error.showStack === undefined || error.showStack === true ? error : `${error}`)
  console.log()
}

function filterOutEslintWarnings(report) {
  let filtered = null
  const results = report.results
  for (let i = 0, len = results.length; i !== len; ++i) {
    const item = results[i]
    if (item.warningCount === 1 && item.errorCount === 0) {
      const messages = item.messages
      if (messages && messages.length === 1) {
        const msg = messages[0]

        const text = msg.message
        // Filter out "file ignored" messages for husky/lint-staged + .eslintignore
        if (
          text === 'File ignored because of a matching ignore pattern. Use "--no-ignore" to override.' ||
          (typeof text === 'string' && text.startsWith('File ignored by default. '))
        ) {
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
