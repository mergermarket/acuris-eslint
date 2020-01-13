const chalk = require('chalk')
const readline = require('readline')

exports.askConfirmation = askConfirmation

async function askConfirmation(message) {
  if (!process.stdin || !process.stdout || !process.stdout.isTTY) {
    return true
  }
  return new Promise(resolve => {
    const iface = readline.createInterface(process.stdin, process.stdout)
    const question = `${chalk.greenBright('?')} ${chalk.whiteBright(message)} ${chalk.gray('(Y/n)')} `
    iface.question(question, answer => {
      const confirm = /^[yY]/.test((answer || '').trim())
      console.log(confirm ? chalk.greenBright('  Yes') : chalk.redBright('  No'))
      iface.close()
      resolve(confirm)
    })
  })
}
