'use strict'

const referencePackageJson = require('../../package.json')

const chalk = require('chalk')
const { emitWarning, emitSection } = require('../lib/notes')

const path = require('path')
const { resolveProjectFile, findUp, findFileUp, runAsync, fileExists } = require('../lib/fs-utils')
const { reloadNodeResolvePaths, hasLocalPackage, projectConfig } = require('../../core/node-modules')
const { askConfirmation, updateTextFileAsync } = require('../lib/text-utils')
const {
  getPackageJsonPath,
  sanitisePackageJson,
  getNeededDependencies,
  addDevDependencies,
  getPackagesToInstall,
  getPackageManager,
  getNpmRegistry
} = require('../lib/package-utils')

module.exports = async (cliOptions) => {
  const packageJsonPath = resolveProjectFile('package.json')
  const foundPackageJsonPath = getPackageJsonPath()
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

      if (require.cache) {
        delete require.cache[packageJsonPath]
      }
      reloadNodeResolvePaths()
      require('eslint-plugin-quick-prettier/prettier-interface').reloadPrettier()

      manifest = await updatePackage(false)
    }
  }

  if (!manifest.private && !Array.isArray(manifest.files)) {
    emitSection('init-npmignore')

    if (!fileExists('.npmignore')) {
      emitWarning(chalk.yellow(`File ${chalk.yellowBright('.npmignore')} does not exists on a public package`))
    }

    await require('./init-npmignore')({ ...cliOptions, askConfirmation: true })
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

          const hasLintStagedConfig =
            !!pkg['lint-staged'] ||
            findFileUp('.lintstagedrc') ||
            findFileUp('lint-staged.config.js') ||
            findFileUp('.lintstagedrc.js')

          const hasHuskyConfig =
            !!pkg.husky ||
            findFileUp('.huskyrc') ||
            findFileUp('.huskyrc.json') ||
            findFileUp('.huskyrc.js') ||
            findFileUp('husky.config.js')

          if (!hasLintStagedConfig && !hasHuskyConfig && findUp('.git', { directories: true, files: false })) {
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
                '*': ['acuris-eslint --lint-staged --fix --max-warnings=0']
              }
            }
          }
        }

        if (pkg['lint-staged']) {
          // acuris-eslint < 0.0.* was using '*.{js,jsx,json,ts,tsx}' as lint-staged filter. Replace with '*' instead.
          let legacyLintStaged = pkg['lint-staged']['*.{js,jsx,json,ts,tsx}']
          if (Array.isArray(legacyLintStaged) && legacyLintStaged.length === 1) {
            legacyLintStaged = legacyLintStaged[0]
          }

          if (typeof legacyLintStaged === 'string' && legacyLintStaged.startsWith('acuris-eslint --lint-staged')) {
            const oldStar = pkg['lint-staged']['*']
            let newStar
            if (oldStar) {
              if (Array.isArray(pkg['lint-staged']['*'])) {
                newStar = [legacyLintStaged, ...oldStar]
              } else if (typeof oldStar === 'string') {
                newStar = [legacyLintStaged, oldStar]
              }
            } else {
              newStar = [legacyLintStaged]
            }
            if (newStar) {
              pkg['lint-staged']['*'] = newStar
              delete pkg['lint-staged']['*.{js,jsx,json,ts,tsx}']
            }
          }
        }

        if (
          typeof pkg['lint-staged'] === 'object' &&
          !Array.isArray(pkg['lint-staged']) &&
          pkg['lint-staged'] !== null
        ) {
          for (const v of Object.values(pkg['lint-staged'])) {
            if (Array.isArray(v) && v[v.length - 1] === 'git add') {
              v.pop()
            }
          }
        }

        const hasDependency = (name) =>
          !!((pkg.devDependencies && pkg.devDependencies[name]) || (pkg.dependencies && pkg.dependencies[name]))

        let neededDependencies = getNeededDependencies(pkg)
        if (
          canAsk &&
          !projectConfig.ignoredPackages.has('typescript') &&
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
