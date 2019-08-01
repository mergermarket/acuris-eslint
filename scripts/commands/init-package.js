'use strict'

/* eslint-disable require-atomic-updates */

const referencePackageJson = require('../../package.json')

const chalk = require('chalk').default
const { emitWarning, emitSection } = require('../lib/notes')

const path = require('path')
const { askConfirmation } = require('../lib/inquire')
const { resolveProjectFile, findUp, runAsync, fileExists } = require('../lib/fs-utils')
const { reloadNodeResolvePaths } = require('../../core/node-modules')
const { updateTextFileAsync } = require('../lib/text-utils')
const {
  getPackageJsonPath,
  sanitisePackageJson,
  getNeededDependencies,
  addDevDependencies,
  hasPackagesToInstall,
  getPackageManager
} = require('../lib/package-utils')

module.exports = async options => {
  const packageJsonPath = resolveProjectFile('package.json')

  let foundPackageJsonPath = getPackageJsonPath()

  if (!findUp(resolveProjectFile('.git'), { directories: true, files: false })) {
    if (await askConfirmation(`.git not found. Do you want to run ${chalk.yellow('git init')}?`)) {
      await runAsync('git', ['init'])
    }
  }

  if (!foundPackageJsonPath) {
    emitWarning(chalk.yellow('package.json not found. Creating one...\n'))
    await runAsync('npm', ['init'])
    foundPackageJsonPath = findUp('package.json', { directories: false, files: true })
  }

  if (!foundPackageJsonPath) {
    throw new Error('Could not find package.json')
  }

  if (packageJsonPath && path.relative(packageJsonPath, foundPackageJsonPath) !== '') {
    throw new Error(
      `Cannot initialize a sub package. Run this command in the root project. Root project found at ${foundPackageJsonPath}.`
    )
  }

  let manifest = await updatePackage(packageJsonPath)

  if (hasPackagesToInstall()) {
    console.log(chalk.cyan('\n  Some packages are missing...'))
    if (!process.env.ACURIS_ESLINT_RUN_ASYNC) {
      if (getPackageManager() === 'yarn') {
        if (await askConfirmation(`Can i run ${chalk.yellowBright('yarn')}?`)) {
          await runAsync('yarn', [])
        }
      } else if (await askConfirmation(`Can i run ${chalk.yellowBright('npm install')}?`)) {
        await runAsync('npm', ['install'])
      }
    }

    reloadNodeResolvePaths()
    manifest = await updatePackage(packageJsonPath)
  }

  if (options.initNpmignore !== false) {
    if (!Array.isArray(manifest.files) && !manifest.private) {
      emitSection('init-npmignore')

      if (!fileExists('.npmignore')) {
        emitWarning(chalk.yellow(`File ${chalk.yellowBright('.npmignore')} does not exists on a public package`))
      }

      await require('./init-npmignore')({ ...options, askConfirmation: true })
    }
  }
}

async function updatePackage(packageJsonPath) {
  let resultManifest
  await updateTextFileAsync({
    format: 'json-stringify',
    filePath: packageJsonPath,
    throwIfNotFound: true,
    async content(manifest) {
      if (typeof manifest !== 'object' || manifest === null || Array.isArray(manifest)) {
        throw new TypeError('Invalid package.json')
      }

      if (
        !manifest.husky &&
        !manifest['lint-staged'] &&
        findUp(resolveProjectFile('.git'), { directories: true, files: false })
      ) {
        if (
          await askConfirmation(
            `Can I configure ${chalk.yellowBright('husky')} and ${chalk.yellowBright(
              'lint-staged'
            )} to run ${chalk.cyanBright('acuris-eslint')} before commit?`
          )
        ) {
          manifest.husky = {
            hooks: {
              'pre-commit': 'lint-staged'
            }
          }
          manifest['lint-staged'] = {
            '*.{js,jsx,json,ts,tsx}': ['acuris-eslint --fix --max-warnings=0', 'git add']
          }
        }
      }

      const neededDependencies = getNeededDependencies(manifest)
      addDevDependencies(manifest, neededDependencies)

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
      resultManifest = manifest
      return manifest
    }
  })
  return resultManifest
}
