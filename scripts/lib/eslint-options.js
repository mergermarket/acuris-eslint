'use strict'

const path = require('path')
const nodeModules = require('../../core/node-modules')
const eslintSupport = require('../../core/eslint-support')
const eslintCommands = require('./eslint-commands')
const chalk = require('chalk').default

const programName = path.basename(process.argv[1], '.js')

const eslintOptionsPath = require.resolve('eslint/lib/options')

// eslint-disable-next-line node/no-extraneous-require
const optionatorPath = require.resolve('optionator', {
  paths: nodeModules.nodeModulePaths(eslintOptionsPath)
})

if (eslintOptionsPath in require.cache) {
  delete require.cache[eslintOptionsPath]
}

const optionator = require(optionatorPath)

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

function acurisEslintOptionator(libOptions) {
  const optionsMap = getOptionatorOptionsMap(libOptions)

  libOptions.prepend = ''

  optionsMap.get('ext').default = eslintSupport.extensions.join(',')

  optionsMap.get('cache-location').default = 'node_modules/.eslintcache'

  const cacheFileOption = optionsMap.get('cache-file')
  if (cacheFileOption) {
    delete cacheFileOption.default
  }

  if (!eslintSupport.isCI) {
    const cacheOption = optionsMap.get('cache')
    cacheOption.default = 'true'
    cacheOption.description = 'Only check changed files. Enabled by default, disable with --no-cache'
  }

  return optionator(libOptions)
}

require.cache[optionatorPath].exports = acurisEslintOptionator
try {
  const acurisEslintOptions = require(eslintOptionsPath)

  const oldParse = acurisEslintOptions.parse
  acurisEslintOptions.parse = function parse(input, parseOptions) {
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

  const oldGenerateHelp = acurisEslintOptions.generateHelp
  acurisEslintOptions.generateHelp = function generateHelp(helpOptions) {
    let usage = '\nUsage:\n\n'

    usage += `${chalk.whiteBright.bold(programName)} [options] [file.js] [dir]\n`
    usage += `  ${chalk.cyan('lints the current folder or the given files\n\n')}`

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

    const help = oldGenerateHelp.call(this, helpOptions)

    return `${usage}${help}${chalk.rgb(150, 150, 150)(additionalHelp.join('\n'))}`
  }

  module.exports = acurisEslintOptions
} finally {
  require.cache[optionatorPath].exports = optionator
}
