const path = require('path')
const { runAsync, resolveAcurisEslintFile } = require('../lib/fs-utils')

module.exports = async (cliOptions) => {
  if (path.relative(resolveAcurisEslintFile(), process.cwd())) {
    return runAsync('npx', ['@acuris/eslint-config@latest', '--init', '--lint-staged'])
  }

  require('../acuris-eslint-help').printLogo()
  return require('./init')(cliOptions)
}
