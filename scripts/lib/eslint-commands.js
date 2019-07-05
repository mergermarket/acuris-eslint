const path = require('path')
const fs = require('fs')
const chalk = require('chalk').default

const isInvalidCommandRegex = /^(con|prn|aux|nul|((com|lpt)[0-9]))$|([<>:"/\\|?*.\s])|(^[_-])/gi

function getCommandsFolder() {
  return path.resolve(__dirname, '..', 'commands')
}

function getCommand(command) {
  if (typeof command !== 'string' || command.length === 0 || isInvalidCommandRegex.test(command)) {
    return null
  }
  try {
    const result = require(path.resolve(getCommandsFolder(), command))
    return typeof result === 'function' ? result : null
  } catch (error) {
    if (error && error.code === 'MODULE_NOT_FOUND' && error.message && error.message.indexOf(command) > 0) {
      return null
    }
    throw error
  }
}

function getCommandNames() {
  const result = new Set()
  const commandsFolder = getCommandsFolder()
  for (const dirent of fs.readdirSync(commandsFolder, { withFileTypes: true })) {
    const name = dirent.name
    if (!name.startsWith('_')) {
      if (dirent.isFile()) {
        if (name.endsWith('.js') && name !== 'index.js') {
          result.add(name.slice(0, name.length - 3))
        }
      } else if (dirent.isDirectory() && name !== 'lib') {
        if (fs.existsSync(path.resolve(commandsFolder, name, 'index.js'))) {
          result.add(name)
        }
      }
    }
  }
  return result
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

exports.getCommandNames = getCommandNames

exports.getCommandsHelp = getCommandsHelp
