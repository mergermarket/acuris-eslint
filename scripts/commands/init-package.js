'use strict'

const referencePackageJson = require('../../package.json')

const chalk = require('chalk').default
const { notes, emitWarning } = require('../lib/notes')

const { resolveProjectFile, fileExists, findUp, runAsync } = require('../lib/fs-utils')
const { updateTextFileAsync, readTextFile } = require('../lib/text-utils')
const {
  sanitisePackageJson,
  getNeededDependencies,
  addDevDependencies,
  hasPackagesToInstall,
  getPackageManager
} = require('../lib/package-utils')

module.exports = async () => {
  const packageJsonPath = resolveProjectFile('package.json')

  let foundPackageJsonPath = findUp('package.json', { directories: false, files: true })

  if (!foundPackageJsonPath) {
    emitWarning(chalk.yellow('package.json not found. Creating one...\n'))
    await runAsync('npm', 'init')
    foundPackageJsonPath = findUp('package.json', { directories: false, files: true })
  }

  if (!foundPackageJsonPath) {
    throw new Error('Could not find package.json')
  }

  if (packageJsonPath && packageJsonPath.toLowerCase() !== foundPackageJsonPath.toLowerCase()) {
    throw new Error(
      `Cannot initialize a sub package. Run this command in the root project. Root project found at ${packageJsonPath}.`
    )
  }

  if (!findUp(resolveProjectFile('.git'), { directories: true, files: false })) {
    notes.gitFolderNotFound = true
  }

  await updateTextFileAsync({
    format: 'json-stringify',
    filePath: packageJsonPath,
    throwIfNotFound: true,
    async content(manifest) {
      if (typeof manifest !== 'object' || manifest === null || Array.isArray(manifest)) {
        throw new TypeError('Invalid package.json')
      }

      if (manifest.private === undefined && !manifest.files && !fileExists(resolveProjectFile('.npmignore'))) {
        notes.packageJsonIsNotPrivateWarning = true
      }

      const neededDependencies = getNeededDependencies(manifest)
      if (addDevDependencies(manifest, neededDependencies)) {
        notes.needsNpmInstall = true
      }

      if (
        (manifest.devDependencies && manifest.devDependencies[referencePackageJson.name]) ||
        (manifest.dependencies && manifest.dependencies[referencePackageJson.name])
      ) {
        if (!manifest.scripts) {
          manifest.scripts = {}
        }
        if (manifest.scripts['acuris-eslint'] === undefined) {
          manifest.scripts['acuris-eslint'] = 'acuris-eslint'
        }
      }

      manifest = sanitisePackageJson(manifest)
      return manifest
    }
  })

  if (!notes.needsNpmInstall && hasPackagesToInstall(readTextFile(packageJsonPath, 'json-stringify'))) {
    notes.needsNpmInstall = true

    if (getPackageManager() === 'yarn') {
      await runAsync('yarn', [])
    } else {
      await runAsync('npm', ['install'])
    }

    // eslint-disable-next-line require-atomic-updates
    notes.needsNpmInstall = hasPackagesToInstall(readTextFile(packageJsonPath, 'json-stringify'))
  }
}

module.exports.description = 'updates package.json'
