'use strict'

const path = require('path')
const nodeModules = require('../../core/node-modules')
const eslintSupport = require('../../core/eslint-support')
const eslintCommands = require('./eslint-commands')
const chalk = require('chalk').default

const programName = path.basename(process.argv[1], '.js')

const optionator = require('optionator')

function getOptionatorOptionsMap(libOptions) {
  const options = new Map()
  for (const optionObj of libOptions.options) {
    const name = optionObj.option
    if (name) {
      options.set(name, optionObj)
    }
  }
  return options
}

function acurisEslintOptions(libOptions) {
  const optionsMap = getOptionatorOptionsMap(libOptions)

  libOptions.prepend = ''

  if (!optionsMap.has('cwd')) {
    libOptions.options.splice(1, 0, {
      option: 'cwd',
      type: 'path::String',
      description: 'The base folder for the project (cwd)'
    })
  }

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

  return optionator(libOptions)
}

function extendOptions(instance) {
  const oldParse = instance.parse
  const oldGenerateHelp = instance.generateHelp

  instance.parse = function parse(input, parseOptions) {
    let commandName
    let command = null

    if (Array.isArray(input)) {
      if (input._acurisEslintOptionsCache && !parseOptions) {
        return input._acurisEslintOptionsCache
      }

      if (input[2] === 'help') {
        input = input.slice()
        input[2] = '--help'
      }

      command = eslintCommands.getCommand(input[2])
      if (command) {
        commandName = input[2]
        input = [input[0], input[1], ...input.slice(3)]
      }

      if (input.length === 3) {
        if (input[2] === 'help' || input[2] === 'init' || input[2] === 'delete-cache') {
          input = [input[0], input[1], `--${input[2]}`]
        }
      }
    }

    const parsed = oldParse.call(this, input, parseOptions)
    if (!parsed._ || (!parsed._.length && !parsed.printConfig && !parsed.help)) {
      parsed._ = ['.']
    }

    const format = parsed.format

    if (!command && parsed.init) {
      command = eslintCommands.getCommand('init')
      if (command) {
        commandName = 'init'
      }
    }

    parsed.commandName = commandName
    parsed.command = command
    parsed.canLog =
      !format ||
      format === 'unix' ||
      format === 'visualstudio' ||
      format === 'codeframe' ||
      format === 'table' ||
      format === 'compact' ||
      format === 'stylish'

    input._acurisEslintOptionsCache = parsed

    return parsed
  }

  instance.generateHelp = function generateHelp(helpOptions) {
    let usage = `\n${chalk.yellowBright('Usage')}:\n\n`

    usage += eslintCommands.getCommandsHelp(programName)

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

    help = help.replace(/(^([A-Za-z\s])+):/gm, `${chalk.yellow('$1')}:`)

    return `${usage}${help}${chalk.gray(additionalHelp.join('\n'))}`
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
      { option: 'help', alias: 'h', type: 'Boolean', description: 'Show help' }
    ]
  }
}

function createEslintOptions() {
  let baseOptions
  try {
    require.resolve('eslint')
    const eslintOptionsPath = require.resolve('eslint/lib/options')
    const eslintOptionatorPath = require.resolve('optionator', {
      paths: nodeModules.nodeModulePaths(require.resolve('eslint/package.json'))
    })
    if (eslintOptionsPath in require.cache) {
      delete require.cache[eslintOptionsPath]
    }
    require.cache[eslintOptionatorPath].exports = acurisEslintOptions
    try {
      baseOptions = require(eslintOptionsPath)
    } finally {
      require.cache[eslintOptionatorPath].exports = optionator
    }
  } catch (error) {
    if (error && error.code === 'MODULE_NOT_FOUND') {
      console.warn(
        chalk.yellowBright('[warning]'),
        chalk.yellow(`${error.message}`.split('\n')[0]),
        chalk.gray('- try to run `npm install` or `yarn`')
      )
    } else {
      throw error
    }
  }
  return extendOptions(baseOptions || getBasicOptions())
}

module.exports = createEslintOptions()
