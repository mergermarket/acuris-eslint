'use strict'

const referencePackageJson = require('../../package.json')

const chalk = require('chalk')
const { emitWarning, emitSection } = require('../lib/notes')

const path = require('path')
const { askConfirmation } = require('../lib/inquire')
const { resolveProjectFile, findUp, runAsync, fileExists } = require('../lib/fs-utils')
const { reloadNodeResolvePaths, hasLocalPackage } = require('../../core/node-modules')
const { updateTextFileAsync } = require('../lib/text-utils')
const {
  getPackageJsonPath,
  sanitisePackageJson,
  getNeededDependencies,
  addDevDependencies,
  getPackagesToInstall,
  getPackageManager,
  getNpmRegistry
} = require('../lib/package-utils')

module.exports = async options => {
  const packageJsonPath = resolveProjectFile('package.json')

  const foundPackageJsonPath = getPackageJsonPath()

  if (!findUp('.git', { directories: true, files: false })) {
    if (await askConfirmation(`.git not found. Do you want to run ${chalk.yellow('git init')}?`)) {
      await runAsync('git', ['init'])
    }
  }

  if (foundPackageJsonPath && path.relative(packageJsonPath, foundPackageJsonPath) !== '') {
    throw new Error(
      `Cannot initialize a sub package. Run this command in the root project. Root project found at ${foundPackageJsonPath}.`
    )
  }

  if (!fileExists(packageJsonPath)) {
    emitWarning(chalk.yellow('package.json not found. Creating one...\n'))
    await runAsync('npm', ['init'])
  }

  let manifest = await updatePackage(true)

  const packagesToInstall = getPackagesToInstall()
  if (packagesToInstall.length > 0) {
    console.log(chalk.cyan('\n  Packages are missing...'), chalk.gray(packagesToInstall.join(' ')))
    if (!process.env.ACURIS_ESLINT_RUN_ASYNC) {
      const packageManager = getPackageManager()
      if (packageManager === 'yarn') {
        if (await askConfirmation(`Can i run ${chalk.yellowBright('yarn')}?`)) {
          await runAsync('yarn', [])
        }
      } else if (await askConfirmation(`Can i run ${chalk.yellowBright('npm install')}?`)) {
        await runAsync('npm', ['install'])
      }

      reloadNodeResolvePaths()
      manifest = await updatePackage(false)
    }
  }

  if (options.initNpmignore !== false) {
    if (!manifest.private && !Array.isArray(manifest.files)) {
      emitSection('init-npmignore')

      if (!fileExists('.npmignore')) {
        emitWarning(chalk.yellow(`File ${chalk.yellowBright('.npmignore')} does not exists on a public package`))
      }

      await require('./init-npmignore')({ ...options, askConfirmation: true })
    }
  }

  async function updatePackage(canAsk) {
    let resultManifest
    await updateTextFileAsync({
      format: 'json-stringify',
      filePath: packageJsonPath,
      throwIfNotFound: true,
      async content(pkg) {
        pkg = sanitisePackageJson(pkg)

        if (canAsk) {
          if (pkg.private !== true && pkg.private !== false) {
            if (Array.isArray(pkg.files) || fileExists(resolveProjectFile('.npmignore'))) {
              pkg.private = false
            } else {
              emitWarning(
                `${chalk.yellow('Field ')} ${chalk.yellowBright(
                  `private: ${chalk.greenBright('false')} | ${chalk.redBright('true')}`
                )} ${chalk.yellow('not found in')} ${chalk.yellowBright('package.json')}.\n  ${chalk.yellow(
                  'Set'
                )} ${chalk.yellowBright('private: ')}${chalk.greenBright('true')} ${chalk.yellow(
                  "if you dont't want this package to be published."
                )}\n  ${chalk.yellow('Set')} ${chalk.yellowBright('private: ')}${chalk.redBright(
                  'false'
                )} ${chalk.yellow(
                  'if this package can be published.'
                )}\n  The configured npm registry is ${await getNpmRegistry()}\n  ${chalk.blue(
                  'https://docs.npmjs.com/files/package.json#private'
                )}`
              )

              pkg.private = !!(await askConfirmation(
                `Is this a ${chalk.yellowBright('private')}${chalk.yellow(': ')}${chalk.greenBright('true')} package?`
              ))
            }
          }

          if (
            !pkg.husky &&
            !pkg['lint-staged'] &&
            findUp(resolveProjectFile('.git'), { directories: true, files: false })
          ) {
            if (
              await askConfirmation(
                `Can I configure ${chalk.yellowBright('husky')} and ${chalk.yellowBright(
                  'lint-staged'
                )} to run ${chalk.cyanBright('acuris-eslint')} before commit?`
              )
            ) {
              pkg.husky = {
                hooks: {
                  'pre-commit': 'lint-staged'
                }
              }
              pkg['lint-staged'] = {
                '*.{js,jsx,json,ts,tsx}': ['acuris-eslint --lint-staged --fix --max-warnings=0', 'git add']
              }
            }
          }
        }

        const hasDependency = name =>
          !!((pkg.devDependencies && pkg.devDependencies[name]) || (pkg.dependencies && pkg.dependencies[name]))

        let neededDependencies = getNeededDependencies(pkg)
        if (
          canAsk &&
          !neededDependencies.has('typescript') &&
          !hasDependency('typescript') &&
          !hasLocalPackage('typescript')
        ) {
          if (await askConfirmation(`Would you like to add ${chalk.cyanBright('typescript')} support?`)) {
            neededDependencies.add('typescript')
            addDevDependencies(pkg, neededDependencies)
            neededDependencies = getNeededDependencies(pkg)
          }
        }
        addDevDependencies(pkg, neededDependencies)

        if (hasDependency(referencePackageJson.name)) {
          if (!pkg.scripts) {
            pkg.scripts = {}
          }
          if (pkg.scripts['acuris-eslint'] === undefined) {
            pkg.scripts['acuris-eslint'] = 'npx acuris-eslint'
          }
        }

        pkg = sanitisePackageJson(pkg)
        resultManifest = pkg
        return pkg
      }
    })
    return resultManifest
  }
}
