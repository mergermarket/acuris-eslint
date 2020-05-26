#!/usr/bin/env node
'use strict'

if (!global.__v8__compile__cache) {
  require('v8-compile-cache')
}

const path = require('path')
const fs = require('fs')

const { tryParseAcurisEslintOptions, translateOptionsForCLIEngine } = require('./lib/acuris-eslint-options')

const cliOptions = tryParseAcurisEslintOptions()

const options = cliOptions.options || {}
if (options.cwd) {
  process.chdir(path.resolve(options.cwd))
}

const {
  eslintRequire,
  eslintTryRequire,
  getEslintVersion,
  assertEslintVersion,
  eslintPackageJsonPath
} = require('../core/node-modules')
const { startPrettierService } = require('./lib/eslint-prettier/prettier-service')

const { version: packageVersion } = require('../package.json')

const chalk = require('chalk')

let _handledErrors
let timerStarted = null
let fixedFiles = 0
let iteratedFiles = 0

process.on('uncaughtException', handleError)

if (chalk.level > 0) {
  require('util').inspect.defaultOptions.colors = true
}

const fix = options.fix && !options.fixDryRun && !options.stdin

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

  eslint()
    .then((exitCode) => {
      endTimeLog()
      if (exitCode && !process.exitCode) {
        process.exitCode = exitCode
      }
    })
    .catch(handleError)
}

async function eslint() {
  let endIterationPromise
  let endMonkeyPatch
  let results
  let ESLint
  let engine

  try {
    if (options.debug) {
      const eslintDebug = eslintTryRequire('debug')
      if (eslintDebug) {
        eslintDebug.enable('eslint:*,-eslint:code-path')
      }
    }

    endMonkeyPatch = monkeyPatchEslint()

    ESLint = eslintRequire('./lib/eslint/eslint.js').ESLint

    engine = new ESLint(translateOptionsForCLIEngine(cliOptions))

    results = options.stdin
      ? await engine.lintText(fs.readFileSync(0, 'utf8'), options.stdinFilename, false)
      : await engine.lintFiles(cliOptions.list)
  } finally {
    endIterationPromise = endMonkeyPatch()
  }

  if (fix) {
    const isAbsolute = path.isAbsolute
    const writeFile = fs.promises.writeFile
    await Promise.all(
      results
        .filter((r) => r && typeof r.output === 'string' && isAbsolute(r.filePath))
        .map(async (r) => {
          await writeFile(r.filePath, r.output)
          ++fixedFiles
        })
    )
  }

  const endIterationResult = await endIterationPromise
  if (endIterationResult) {
    fixedFiles += endIterationResult.prettified
    results.push(...endIterationResult.errors)
  }

  if (options.quiet) {
    // Quiet mode enabled - filtering out warnings
    results = ESLint.getErrorResults(results)
  } else {
    results = filterOutEslintWarnings(results)
  }

  if (await printEslintResults(engine, results, options.format, options.outputFile)) {
    const status = getResultsStatus(results)

    const tooManyWarnings = status === 1
    if (tooManyWarnings) {
      console.error(chalk.redBright(`ESLint found too many warnings (maximum: ${options.maxWarnings})\n`))
    }

    return status
  }
  return 2
}

function getResultsStatus(results) {
  let warningCount = 0
  for (let i = 0; i < results.length; ++i) {
    const item = results[i]
    if (item.errorCount > 0) {
      return 2
    }
    warningCount += item.warningCount || 0
  }
  return options.maxWarnings >= 0 && warningCount > options.maxWarnings ? 1 : 0
}

async function printEslintResults(engine, results, format, outputFile) {
  let formatter
  try {
    formatter = await engine.loadFormatter(format)
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

  const output = formatter.format(results, rulesMetaProvider)
  if (!output) {
    return true
  }

  if (outputFile) {
    const filePath = path.resolve(process.cwd(), outputFile)

    if (fs.existsSync(filePath) && (await fs.promises.stat(filePath)).isDirectory()) {
      console.error(chalk.redBright('Cannot write to output file path, it is a directory: %s'), outputFile)
      return false
    }

    try {
      require('./lib/fs-utils').mkdirSync(path.dirname(filePath))
      await fs.promises.writeFile(filePath, output)
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
    timerStarted = null
    const exitCode = process.exitCode
    const args = [msg]

    if (exitCode) {
      args.push(chalk.redBright(`exit code ${exitCode}`))
      args.push(chalk.gray(`- ${iteratedFiles} files processed`))
    } else if (iteratedFiles > 0) {
      args.push(chalk.greenBright('ok'))
      args.push(chalk.gray('-'))
      args.push(chalk.greenBright(iteratedFiles))
      args.push(chalk.green('file processed'))
    } else {
      args.push(chalk.gray('-'))
      args.push(chalk.yellowBright('0'))
      args.push(chalk.yellow('file processed'))
    }

    if (fix) {
      if (fixedFiles > 0) {
        args.push(
          chalk.gray('- ') + chalk.cyanBright(fixedFiles) + chalk.cyan(` file${fixedFiles === 1 ? '' : 's'} fixed`)
        )
      } else {
        args.push(chalk.gray(`- ${fixedFiles} files fixed`))
      }
    }
    console.timeLog(...args)
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
      const eslintPath = path.dirname(eslintPackageJsonPath())
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

function filterOutEslintWarnings(results) {
  let filtered = null
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
          if (filtered === null) {
            filtered = results.slice(0, i)
          }
          continue
        }
      }
    }
    if (filtered !== null) {
      filtered.push(item)
    }
  }
  return filtered || results
}

function monkeyPatchEslint() {
  const fsCache = require('./lib/fs-cache')
  const stopFsCache = fsCache.startFsCache().stop
  assertEslintVersion()
  stopFsCache()

  const fileEnumeratorProto = eslintRequire('./lib/cli-engine/file-enumerator.js').FileEnumerator.prototype

  const old_isIgnoredFile = fileEnumeratorProto._isIgnoredFile
  const oldIterateFiles = fileEnumeratorProto.iterateFiles
  const oldIsTargetPath = fileEnumeratorProto.isTargetPath

  fileEnumeratorProto.iterateFiles = iterateFiles

  if (options.lintStaged || options.ignoreUnknownExtensions) {
    fileEnumeratorProto._isIgnoredFile = _isIgnoredFile
  }

  const prettierService = fix && startPrettierService({ debug: options.debug })
  if (prettierService) {
    // Monkey patch eslint FileEnumerator to pass ignored files to prettier
    fileEnumeratorProto.isTargetPath = isTargetPath
  }

  const endAsync = async () => {
    const result = (prettierService && (await prettierService.end())) || { prettified: 0, errors: [], iteratedFiles }
    result.iteratedFiles = iterateFiles
    return result
  }

  const end = () => {
    if (fileEnumeratorProto.iterateFiles === iterateFiles) {
      fileEnumeratorProto.iterateFiles = oldIterateFiles
    }
    if (fileEnumeratorProto._isIgnoredFile === _isIgnoredFile) {
      fileEnumeratorProto._isIgnoredFile = old_isIgnoredFile
    }
    if (fileEnumeratorProto.isTargetPath === isTargetPath) {
      fileEnumeratorProto.isTargetPath = oldIsTargetPath
    }
    return endAsync()
  }

  function isTargetPath(filepath, providedConfig) {
    const result = oldIsTargetPath.call(this, filepath, providedConfig)
    if (
      !result &&
      providedConfig &&
      path.isAbsolute(filepath) &&
      !old_isIgnoredFile.call(this, filepath, { ...providedConfig, dotfiles: true, direct: false })
    ) {
      ++iteratedFiles
      prettierService.prettify(filepath)
    }
    return result
  }

  function* iterateFiles(patternOrPatterns) {
    const buffer = []
    let count = 0
    for (const item of oldIterateFiles.call(this, patternOrPatterns)) {
      if (item.ignored) {
        continue // Avoid "File ignored because of a matching ignore pattern" warning.
      }

      if (count < 54) {
        ++iteratedFiles
        buffer.push(item)
        ++count
      } else {
        yield* buffer
        buffer.length = 0
        count = 0
      }
    }
    yield* buffer
  }

  function _isIgnoredFile(filePath, { config, dotfiles, direct }) {
    return (
      old_isIgnoredFile.call(this, filePath, { config, dotfiles, direct }) ||
      !oldIsTargetPath.call(this, filePath, config)
    )
  }

  return end
}
