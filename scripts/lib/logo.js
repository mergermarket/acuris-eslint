const chalk = require('chalk').default

const os = require('os')

function hasUnicode() {
  if (os.type() === 'Windows_NT') {
    return false
  }
  const isUTF8 = /UTF-?8$/i
  const ctype = process.env.LC_ALL || process.env.LC_CTYPE || process.env.LANG
  return isUTF8.test(ctype)
}

const logo = chalk.reset(
  chalk.redBright(`
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣶⡄
⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣾⣿⣿⡄
⠀⠀⠀⠀⠀⠀⠀⠀⢀⣾⣿⣿⣿⣿⡄
⠀⠀⠀⠀⠀⠀⠀⢀⣾⣿⣿⠛⢿⣿⣿⡄
⠀⠀⠀⠀⠀⠀⢀⣾⣿⡿⠃⠀⠈⢻⣿⣿⡄
⠀⠀⠀⠀⠀⢀⣾⣿⡿⠁⠀⠀⠀⠀⢻⣿⣿⡄⠀⠀⠀⠀⠀⠀${chalk.gray('A c u r i s')}
⠀⠀⠀⠀⢀⣾⣿⡟⠁⠀⢀⣠⡀⠀⠀⠹⣿⣿⡄
⠀⠀⠀⢀⣾⣿⡏⣀⣤⣾⣿⠿⣿⣷⣦⣄⠹⣿⣿⡄
⠀⠀⢀⣾⣿⣿⣿⣿⠟⠋⠁⠀⠀⠙⠻⢿⣿⣿⣿⣿⡄
⠀⢀⣾⣿⣿⠟⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠻⢿⣿⣿⡄
⠀⠾⠛⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠙⠿

`)
)

module.exports = {
  logo,
  printLogo() {
    if (!('CI' in process.env) && hasUnicode) {
      process.stdout.write(logo)
    }
  }
}
