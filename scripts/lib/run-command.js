const { flushNotes } = require('./notes')
const chalk = require('chalk')

module.exports = function runCommand(cliOptions) {
  const { key: commandName } = cliOptions.command

  if (commandName === 'help') {
    require('../acuris-eslint-help').printAcurisEslintHelp()
    return
  }

  if (commandName === 'commands') {
    require('../acuris-eslint-help').printAcurisEslintCommands()
    return
  }

  if (commandName === 'version') {
    require('../acuris-eslint-help').printVersion()
    return
  }

  if (commandName === 'sys-info') {
    require('../acuris-eslint-help').printSysInfo()
    return
  }

  if (commandName === 'logo') {
    require('../acuris-eslint-help').printLogo(cliOptions)
    return
  }

  if ((commandName.startsWith('init') || commandName === 'update') && !cliOptions.options.lintStaged) {
    const s = `${chalk.whiteBright(cliOptions.programName)} ${chalk.cyanBright(` --${cliOptions.command.option}`)}`
    console.log(`\n${chalk.redBright('-')} ${chalk.bold(s)}`)
  }

  try {
    const command = require(`../commands/${commandName}`)

    if (!command.name || command.name === 'exports') {
      Object.defineProperty(command, 'name', { value: commandName, configurable: true })
    }

    const commandResult = command(cliOptions)
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
