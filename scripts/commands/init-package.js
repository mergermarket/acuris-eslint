'use strict'

const chalk = require('chalk').default
const { spawn } = require('child_process')
const util = require('util')
const spawnAsync = util.promisify(spawn)
const { notes, emitWarning } = require('../lib/notes')

const sourcePackageJson = require('../../package.json')

const { resolveProjectFile, fileExists, directoryExists, findUp } = require('../lib/fs-utils')
const { updateTextFileAsync, readTextFile } = require('../lib/text-utils')
const { sanitisePackageJson, addDevDependencies, hasPackagesToInstall } = require('../lib/package-utils')

module.exports = async () => {
  const packageJsonPath = resolveProjectFile('package.json')

  if (packageJsonPath && packageJsonPath !== findUp('package.json', { directories: false, files: false })) {
    throw new Error(
      `Cannot initialize a sub package. Run this command in the root project. Root project found at ${packageJsonPath}.`
    )
  }

  if (!packageJsonPath) {
    emitWarning(chalk.yellow('package.json not found. Creating one...\n'))
    await spawnAsync('npm', ['init'], { stdio: 'inherit' })
  }

  if (!findUp(resolveProjectFile('.git'), { directories: true, files: false })) {
    notes.gitFolderNotFound = true
  }

  await updateTextFileAsync({
    format: 'json-stringify',
    filePath: packageJsonPath,
    async content(manifest) {
      if (manifest === undefined) {
        throw new Error('Could not find package.json')
      }

      if (!manifest.scripts) {
        manifest.scripts = {}
      }
      if (manifest.scripts['acuris-eslint'] === undefined) {
        manifest.scripts['acuris-eslint'] = 'acuris-eslint'
      }

      const devDependenciesToAdd = {
        ...sourcePackageJson.peerDependencies
      }

      if (manifest.name !== sourcePackageJson.name) {
        devDependenciesToAdd[manifest.name] = `>=${manifest.version}`
      }

      if (addDevDependencies(manifest, devDependenciesToAdd)) {
        notes.needsNpmInstall = true
      }

      if (manifest.private === undefined && !manifest.files && !fileExists(resolveProjectFile('.npmignore'))) {
        notes.packageJsonIsNotPrivateWarning = true
      }

      manifest = sanitisePackageJson(manifest)
      return manifest
    }
  })

  if (!notes.needsNpmInstall && !directoryExists(resolveProjectFile('node_modules'))) {
    notes.needsNpmInstall = true
  }

  if (!notes.needsNpmInstall && hasPackagesToInstall(readTextFile(packageJsonPath, 'json-stringify'))) {
    notes.needsNpmInstall = true
  }
}

module.exports.description = 'updates package.json'
