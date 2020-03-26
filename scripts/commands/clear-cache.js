'use strict'

const chalk = require('chalk')
const path = require('path')
const { deleteFileOrDir } = require('../lib/fs-utils')

module.exports = (cliOptions) => {
  const pathsToDelete = new Set()
  const options = cliOptions && cliOptions.options
  if (options) {
    if (options.cacheLocation) {
      pathsToDelete.add(path.resolve(options.cacheLocation))
    }
    if (options.cacheFile) {
      pathsToDelete.add(path.resolve(options.cacheFile))
    }
  } else {
    pathsToDelete.add(path.resolve('.eslintcache'))
  }
  pathsToDelete.add(path.resolve('.prettiercache'))
  console.log(chalk.yellow(`\ndeleting eslint cache:\n${[...pathsToDelete].map((p) => `  - ${p}\n`).join('')}`))
  const deletedFilesResult = deleteFileOrDir(pathsToDelete)
  console.log(
    deletedFilesResult.count > 0
      ? chalk.yellowBright(`${deletedFilesResult.toString()}.\n`)
      : chalk.green(`${deletedFilesResult.toString()}\n`)
  )
}
