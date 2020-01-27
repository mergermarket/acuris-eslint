'use strict'

const chalk = require('chalk')
const path = require('path')
const IgnoreFile = require('../lib/IgnoreFile')
const { resolveProjectFile, findUp, runAsync, fileExists } = require('../lib/fs-utils')
const { askConfirmation, updateTextFileAsync } = require('../lib/text-utils')
const { getPackageJsonPath } = require('../lib/package-utils')

module.exports = async cliOptions => {
  let hasGit = findUp('.git', { directories: true, files: false })
  if (!hasGit) {
    const packageJsonPath = resolveProjectFile('package.json')
    const foundPackageJsonPath = getPackageJsonPath()
    if (foundPackageJsonPath && path.relative(packageJsonPath, foundPackageJsonPath) !== '') {
      throw new Error(
        `Cannot initialize a sub package. Run this command in the root project. Root project found at ${foundPackageJsonPath}.`
      )
    }

    if (await askConfirmation(`.git not found. Do you want to run ${chalk.yellow('git init')}?`)) {
      await runAsync('git', ['init'])
      hasGit = findUp('.git', { directories: true, files: false })
    }
  }

  if (fileExists(resolveProjectFile('.gitignore'))) {
    await updateTextFileAsync({
      filePath: resolveProjectFile('.gitignore'),
      async content(previousContent) {
        const target = new IgnoreFile(previousContent)
        target.merge(new IgnoreFile('.eslintcache'), false)
        if (!target.changed) {
          return undefined
        }
        return target.toString()
      }
    })
    console.log('      You can also run `acuris-eslint --init-gitignore` to update all defaults')
  } else if (hasGit) {
    await require('./init-gitignore')(cliOptions)
  }
}
