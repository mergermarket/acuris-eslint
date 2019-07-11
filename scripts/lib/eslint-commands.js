'use strict'

const path = require('path')
const fs = require('fs')
const chalk = require('chalk').default

const isInvalidCommandRegex = /^(con|prn|aux|nul|((com|lpt)[0-9]))$|([<>:"/\\|?*.\s])|(^[_-])/gi

function getCommandsFolder() {
  return path.resolve(__dirname, '..', 'commands')
}

function getCommand(commandName) {
  if (typeof commandName !== 'string' || commandName.length === 0 || isInvalidCommandRegex.test(commandName)) {
    return null
  }
  try {
    const result = require(path.resolve(getCommandsFolder(), commandName))
    if (typeof result === 'function') {
      result.commandName = commandName
      Object.defineProperty(result, 'name', { value: commandName, configurable: true })
      return result
    }
    return null
  } catch (error) {
    if (error && error.code === 'MODULE_NOT_FOUND' && error.message && error.message.indexOf(commandName) > 0) {
      return null
    }
    throw error
  }
}

function getCommands() {
  return Array.from(getCommandNames()).map(getCommand)
}

/** @type {string[]} */
let _commandNames

function getCommandNames() {
  if (_commandNames) {
    return _commandNames
  }
  const set = new Set()
  const commandsFolder = getCommandsFolder()
  for (const dirent of fs.readdirSync(commandsFolder, { withFileTypes: true })) {
    const name = dirent.name
    if (!name.startsWith('_')) {
      if (dirent.isFile()) {
        if (name.endsWith('.js') && name !== 'index.js') {
          set.add(name.slice(0, name.length - 3))
        }
      } else if (dirent.isDirectory() && name !== 'lib') {
        if (fs.existsSync(path.resolve(commandsFolder, name, 'index.js'))) {
          set.add(name)
        }
      }
    }
  }
  _commandNames = Array.from(set).sort()
  return _commandNames
}

function getCommandsHelp(programName = 'acuris-eslint') {
  let usage = ''
  for (const name of getCommandNames()) {
    const cmd = getCommand(name)
    if (typeof cmd === 'function') {
      usage += `${chalk.whiteBright(`${programName} ${name}`)}\n`
      if (typeof cmd.description === 'string') {
        usage += `  ${chalk.cyan(cmd.description)}\n`
      }
      usage += '\n'
    }
  }
  usage += `${chalk.whiteBright(programName)} [options] [file.js] [dir]\n`
  usage += `  ${chalk.cyan('lints the current folder or the given files')}\n\n`
  return usage
}

exports.getCommand = getCommand

exports.getCommands = getCommands

exports.getCommandNames = getCommandNames

exports.getCommandsHelp = getCommandsHelp
