const chalk = require('chalk').default
const path = require('path')
const { deleteFileOrDir } = require('../lib/fs-utils')

module.exports = options => {
  const pathsToDelete = new Set()
  if (options.cacheLocation) {
    pathsToDelete.add(path.resolve(options.cacheLocation))
  }
  if (options.cacheFile) {
    pathsToDelete.add(path.resolve(options.cacheFile))
  }
  console.log(chalk.yellow(`\ndeleting eslint cache:\n${[...pathsToDelete].map(p => `  - ${p}\n`).join('')}`))
  const deletedFilesCount = deleteFileOrDir(options.cacheFile)
  console.log(
    deletedFilesCount > 0
      ? chalk.yellowBright(`${deletedFilesCount} files and folders deleted.\n`)
      : chalk.green('Nothing found.\n')
  )
}

module.exports.description = 'deletes eslint cache from disk'
