const inquirer = require('inquirer')

async function askConfirmation(message) {
  const answer = await inquirer.prompt({
    name: 'confirm',
    type: 'confirm',
    message
  })
  return !!answer.confirm
}

exports.askConfirmation = askConfirmation
