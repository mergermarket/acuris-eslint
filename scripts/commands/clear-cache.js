'use strict'

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
  const deletedFilesResult = deleteFileOrDir(pathsToDelete)
  console.log(
    deletedFilesResult.count > 0
      ? chalk.yellowBright(`${deletedFilesResult.toString()}.\n`)
      : chalk.green(`${deletedFilesResult.toString()}\n`)
  )
}
