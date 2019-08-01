'use strict'

const path = require('path')
const { eslintRequire } = require('../../core/node-modules')
const eslintSupport = require('../../core/eslint-support')
const chalk = require('chalk').default

const programName = path.basename(process.argv[1], '.js')

const optionator = require('optionator')

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

const acurisEslintCommands = {
  init: 'initialises or updates a project',
  'init-eslint': 'updates or creates eslint configuration',
  'init-gitignore': 'updates or creates .gitignore',
  'init-package': 'updates or creates package.json',
  'init-prettier': 'updates or creates prettier configuration',
  'init-tsconfig': 'updates or creates typescript tsconfig.json',
  'init-vscode': 'updates or creates Visual Studio Code workspace settings',
  'clear-cache': 'deletes eslint cache from disk',
  version: 'print versions'
}

function acurisEslintOptions(libOptions) {
  const optionsMap = new OptionsMap(libOptions.options)

  libOptions.prepend = ''

  const extOption = optionsMap.get('ext')
  if (extOption) {
    optionsMap.get('ext').default = eslintSupport.extensions.join(',')
  }

  const cacheLocationOption = optionsMap.get('cache-location')
  if (cacheLocationOption) {
    optionsMap.get('cache-location').default = 'node_modules/.eslintcache'
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

  return instance
}

function getBasicOptions() {
  return {
    options: [
      { option: 'color', type: 'Boolean', alias: 'no-color', description: 'Force enabling/disabling of color' },
      {
        option: 'cache-file',
        type: 'path::String',
        description: 'Path to the cache file. Deprecated: use --cache-location'
      },
      { option: 'cache-location', type: 'path::String', description: 'Path to the cache file or directory' },
      {
        option: 'init',
        type: 'Boolean',
        default: 'false',
        description: 'Run config initialization wizard'
      },
      { option: 'debug', type: 'Boolean', default: false, description: 'Output debugging information' },
      { option: 'help', alias: 'h', type: 'Boolean', description: 'Show help' },
      { option: 'commands', type: 'Boolean', description: 'Show commands help' }
    ]
  }
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
      throw error || new Error()
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
