const { flushNotes } = require('./notes')
const chalk = require('chalk').default

function runCommand(options, appTitle) {
  if (options.commandName.startsWith('init')) {
    require('./logo').printLogo()
  }

  console.log(options.canLog ? `\n${appTitle}${chalk.yellowBright(options.commandName)}\n` : '')

  try {
    const command = require(`../commands/${options.commandName}`)

    if (!command.name || command.name === 'exports') {
      Object.defineProperty(command, 'name', { value: options.commandName, configurable: true })
    }

    const commandResult = command(options)
    if (commandResult && typeof commandResult.then === 'function' && typeof commandResult.catch === 'function') {
      commandResult.then(handleCommandSuccess).catch(handleCommandError)
    } else {
      handleCommandSuccess()
    }
  } catch (error) {
    handleCommandError(error)
  }

  function handleCommandSuccess() {
    flushNotes()
    console.log()
  }

  function handleCommandError(error) {
    if (!process.exitCode) {
      process.exitCode = 1
    }
    try {
      flushNotes()
    } catch (_error) {}
    console.log()
    console.error(chalk.redBright('[ERROR]'), error)
  }
}

module.exports = runCommand
