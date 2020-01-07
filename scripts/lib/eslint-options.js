'use strict'

const path = require('path')
const { eslintRequire } = require('../../core/node-modules')
const eslintSupport = require('../../core/eslint-support')
const chalk = require('chalk')

const programName = path.basename(process.argv[1], '.js')

const optionator = require('optionator')

const acurisEslintCommands = {
  init: 'initialises or updates a project',
  update: 'updates acuris-eslint and all dependencies',
  'init-eslint': 'updates or creates eslint configuration',
  'init-gitignore': 'updates or creates .gitignore',
  'init-npmignore': 'updates or creates .npmignore',
  'init-package': 'updates or creates package.json',
  'init-prettier': 'updates or creates prettier configuration',
  'init-tsconfig': 'updates or creates typescript tsconfig.json',
  'init-vscode': 'updates or creates Visual Studio Code workspace settings',
  'clear-cache': 'deletes eslint cache from disk',
  version: 'print versions'
}

/**
 * Translates the CLI options into the options expected by the eslint CLIEngine.
 */
function translateOptionsForCLIEngine(cliOptions) {
  return {
    envs: cliOptions.env,
    extensions: cliOptions.ext,
    rules: cliOptions.rule,
    plugins: cliOptions.plugin,
    globals: cliOptions.global,
    ignore: cliOptions.ignore,
    ignorePath: cliOptions.ignorePath,
    ignorePattern: cliOptions.ignorePattern,
    configFile: cliOptions.config,
    rulePaths: cliOptions.rulesdir,
    useEslintrc: cliOptions.eslintrc,
    parser: cliOptions.parser,
    parserOptions: cliOptions.parserOptions,
    cache: cliOptions.cache,
    cacheFile: cliOptions.cacheFile,
    cacheLocation: cliOptions.cacheLocation,
    fix: cliOptions.fix || cliOptions.fixDryRun,
    fixTypes: cliOptions.fixType,
    allowInlineConfig: cliOptions.inlineConfig,
    reportUnusedDisableDirectives: cliOptions.reportUnusedDisableDirectives,
    resolvePluginsRelativeTo: cliOptions.resolvePluginsRelativeTo
  }
}

class OptionsMap extends Map {
  constructor(options) {
    super()
    this.options = options
    for (const optionObj of options) {
      const name = optionObj.option
      if (name) {
        this.set(name, optionObj)
      }
    }
  }

  delete(name) {
    if (this.has(name)) {
      const idx = this.options.indexOf(this.get(name))
      if (idx >= 0) {
        this.options.splice(idx, 1)
      }
      return super.delete(name)
    }
    return false
  }
}

function acurisEslintOptions(libOptions) {
  const optionsMap = new OptionsMap(libOptions.options)

  libOptions.prepend = ''

  const extOption = optionsMap.get('ext')
  if (extOption) {
    extOption.default = eslintSupport.extensions.join(',')
  }

  const errorOnUnmatchedPatternOption = optionsMap.get('error-on-unmatched-pattern')
  if (errorOnUnmatchedPatternOption) {
    errorOnUnmatchedPatternOption.default = false
    errorOnUnmatchedPatternOption.description = 'Show errors when pattern is unmatched. Default false.'
  }

  const cacheLocationOption = optionsMap.get('cache-location')
  if (cacheLocationOption) {
    cacheLocationOption.default = '.eslintcache'
  }

  const cacheFileOption = optionsMap.get('cache-file')
  if (cacheFileOption) {
    delete cacheFileOption.default
  }

  if (!eslintSupport.isCI) {
    const cacheOption = optionsMap.get('cache')
    if (cacheOption) {
      cacheOption.default = 'true'
      cacheOption.description = 'Only check changed files. Enabled by default, disable with --no-cache'
    }
  }

  if (!optionsMap.has('cwd')) {
    libOptions.options.push({
      option: 'cwd',
      type: 'path::String',
      description: 'The base folder for the project (cwd)'
    })
  }

  if (!optionsMap.has('commands')) {
    libOptions.options.push({
      option: 'commands',
      type: 'Boolean',
      description: 'Show commands help'
    })
  }

  if (!optionsMap.has('lint-staged')) {
    libOptions.options.push({
      option: 'lint-staged',
      type: 'Boolean',
      description: 'Should be used when called by lint-staged or husky'
    })
  }

  const commandOptions = [{ heading: 'Commands' }]
  for (const key of Object.keys(acurisEslintCommands)) {
    optionsMap.delete(key)
    commandOptions.push({
      option: key,
      type: 'Boolean',
      isCommand: true,
      description: chalk.cyan(acurisEslintCommands[key])
    })
  }
  libOptions.options.splice(0, 0, ...commandOptions)

  return optionator(libOptions)
}

function extendOptionator(instance) {
  const oldParse = instance.parse
  const oldGenerateHelp = instance.generateHelp

  instance.parse = function parse(input, parseOptions) {
    if (Array.isArray(input)) {
      if (input._acurisEslintOptionsCache && !parseOptions) {
        return input._acurisEslintOptionsCache
      }
    }

    const parsed = oldParse.call(this, input, parseOptions)

    if (parsed.lintStaged) {
      parsed.cache = false
    }

    if (parsed.fix && parsed.fixDryRun) {
      parsed.fix = false
    }

    if (parsed.stdin && parsed.fix) {
      parsed.fix = false
      parsed.fixDryRun = true
    }

    if (parsed.fixType && !parsed.fix && !parsed.fixDryRun) {
      throw new Error('The --fix-type option requires either --fix or --fix-dry-run.')
    }

    if (parsed.printConfig && parsed.stdin) {
      throw new Error('The --print-config option and --stdin cannot be used together.')
    }

    if (!parsed._ || (!parsed._.length && !parsed.printConfig && !parsed.help && !parsed.version)) {
      parsed._ = ['.']
    }

    for (const key of Object.keys(acurisEslintCommands)) {
      if (parsed[camelize(key)] === true) {
        parsed.commandName = key
      }
    }

    if (parsed.commandName) {
      parsed.canLog = parsed.commandName !== 'version'
    } else {
      const format = parsed.format
      parsed.canLog =
        !format ||
        format === 'unix' ||
        format === 'visualstudio' ||
        format === 'codeframe' ||
        format === 'table' ||
        format === 'compact' ||
        format === 'stylish'
    }

    input._acurisEslintOptionsCache = parsed

    return parsed
  }

  instance.generateHelp = function generateHelp(helpOptions) {
    let usage = `${chalk.whiteBright(programName)} [options] [file.js] [dir]\n`

    if (helpOptions && helpOptions.showCommandsOnly) {
      const result = ['', usage, `${chalk.greenBright('Commands')}:`, '']
      for (const key of Object.keys(acurisEslintCommands)) {
        result.push(
          `${chalk.white(programName)} ${chalk.whiteBright(`--${key}`)}`,
          `  ${chalk.cyanBright(acurisEslintCommands[key])}`,
          ''
        )
      }
      return result.join('\n')
    }

    const additionalHelp = []
    additionalHelp.push('', '')
    additionalHelp.push('Features {')
    for (const key of Object.keys(eslintSupport)) {
      const value = eslintSupport[key]
      if (typeof value === 'boolean' || typeof value === 'string' || typeof value === 'number') {
        additionalHelp.push(`  ${key}: ${value}`)
      }
    }
    additionalHelp.push(`  supported extensions: ${eslintSupport.extensions.join(' ')}`)
    additionalHelp.push('}')

    let help = oldGenerateHelp.call(this, helpOptions)

    help = help.replace(/(^(Commands)):/gm, `${chalk.greenBright('$1')}:\n`)
    help = help.replace(/(^([A-Za-z\s])+):/gm, `${chalk.yellow('$1')}:`)

    usage += `  ${chalk.cyan('lints the current folder or the given files')}\n\n`

    return `\n${usage}${help}${chalk.gray(additionalHelp.join('\n'))}`
  }

  instance.tryParse = function tryParse(input, parseOptions) {
    let options
    try {
      options = instance.parse(input, parseOptions)
    } catch (error) {
      if (error && error.message && error.name === 'Error') {
        console.error(`\n${chalk.redBright(`Error: ${error.message}`)}\n`)
        console.error(`${chalk.yellowBright(`  run ${chalk.bold(`${programName} --help`)} for additional options`)}\n`)
      } else {
        throw error
      }
    }
    return options
  }

  instance.translateOptionsForCLIEngine = translateOptionsForCLIEngine

  return instance
}

function getBasicOptions() {
  const options = [
    {
      option: 'init',
      type: 'Boolean',
      isCommand: true,
      description: 'initialises or updates a project'
    },
    {
      option: 'update',
      type: 'Boolean',
      isCommand: true,
      description: 'updates acuris-eslint and all dependencies'
    },
    { option: 'color', type: 'Boolean', alias: 'no-color', description: 'Force enabling/disabling of color' },
    {
      option: 'cache-file',
      type: 'path::String',
      description: 'Path to the cache file. Deprecated: use --cache-location'
    },
    { option: 'cache-location', type: 'path::String', description: 'Path to the cache file or directory' },
    { option: 'debug', type: 'Boolean', default: false, description: 'Output debugging information' },
    { option: 'help', alias: 'h', type: 'Boolean', description: 'Show help' },
    { option: 'commands', type: 'Boolean', description: 'Show commands help' }
  ]

  return { options }
}

function createEslintOptions() {
  let baseOptions
  try {
    const eslintOptionsPath = eslintRequire.resolve('./lib/options')
    const eslintOptionatorPath = eslintRequire.resolve('optionator')
    if (eslintOptionsPath in require.cache) {
      delete require.cache[eslintOptionsPath]
    }
    if (require.cache[eslintOptionatorPath]) {
      require.cache[eslintOptionatorPath].exports = acurisEslintOptions
    }
    try {
      baseOptions = eslintRequire(eslintOptionsPath)
    } finally {
      require.cache[eslintOptionatorPath].exports = optionator
    }
  } catch (error) {
    if (!error || error.code !== 'MODULE_NOT_FOUND') {
      throw error || new Error('createEslintOptions')
    }
    console.log(`${chalk.gray("Module 'eslint' was not found.")}\n`)
  }

  if (!baseOptions) {
    baseOptions = optionator(getBasicOptions())
  }

  return extendOptionator(baseOptions)
}

function camelize(value) {
  return value.replace(/[-_]+(.)?/g, (_args, c) => (c || '').toUpperCase())
}

module.exports = createEslintOptions()
