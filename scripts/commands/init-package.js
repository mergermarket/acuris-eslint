'use strict'

const chalk = require('chalk').default
const { spawn } = require('child_process')
const util = require('util')
const spawnAsync = util.promisify(spawn)
const { notes } = require('../lib/notes')

const { resolveProjectFile, fileExists, findUp } = require('../lib/fs-utils')
const { updateTextFileAsync } = require('../lib/text-utils')
const { sanitisePackageJson } = require('../lib/package-utils')

module.exports = async () => {
  const packageJsonPath = resolveProjectFile('package.json')

  if (packageJsonPath && packageJsonPath !== findUp('package.json', { directories: false, files: false })) {
    throw new Error(
      `Cannot initialize a sub package. Run this command in the root project. Root project found at ${packageJsonPath}.`
    )
  }

  if (!packageJsonPath) {
    console.log(chalk.yellow('package.json not found. Creating one...\n'))
    await spawnAsync('npm', ['init'], { stdio: 'inherit' })
  }

  if (!findUp(resolveProjectFile('.git', { directories: true, files: false }))) {
    notes.gitFolderNotFound = true
  }

  if (!fileExists(packageJsonPath)) {
    throw new Error('Could not find package.json')
  }

  await updateTextFileAsync({
    language: 'json',
    filePath: packageJsonPath,
    async content(manifest) {
      manifest = sanitisePackageJson(manifest)

      console.log(manifest)
      return manifest
    }
  })
}

module.exports.description = 'updates package.json'
