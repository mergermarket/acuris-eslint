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

const packageJsonLintStageDefault = {
  '*.{js,jsx,json,ts,tsx}': ['acuris-eslint --lint-staged --fix --max-warnings=0']
}

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
    let shouldCreateLintStagedConfigFile = false
    await updateTextFileAsync({
      format: 'json-stringify',
      filePath: packageJsonPath,
      throwIfNotFound: true,
      async content(pkg) {
        pkg = sanitisePackageJson(pkg)

        const hasLintStagedConfigFile =
          findFileUp('.lintstagedrc') || findFileUp('lint-staged.config.js') || findFileUp('.lintstagedrc.js')

        if (pkg['lint-staged']) {
          if (JSON.stringify(pkg['lint-staged']) !== JSON.stringify(packageJsonLintStageDefault)) {
            throw new Error(
              `Project cannot have both ${chalk.redBright('"lint-staged"')} in package.json and ${chalk.redBright(
                (fileExists('.lintstagedrc') && '.lintstagedrc') ||
                  (fileExists('lint-staged.config.js') && 'lint-staged.config.js') ||
                  (fileExists('.lintstagedrc.js') && '.lintstagedrc.js')
              )} lint-staged configuration file. ${chalk.yellow(
                `Is adviced to remove "lint-staged" from package.json and let ${chalk.yellowBright(
                  'acuris-eslint'
                )} create the configuration file.`
              )}`
            )
          }
        }

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

          const hasHusky =
            !!pkg.husky ||
            findFileUp('.huskyrc') ||
            findFileUp('.huskyrc.json') ||
            findFileUp('.huskyrc.js') ||
            findFileUp('husky.config.js')

          if (
            !hasHusky &&
            !pkg['lint-staged'] &&
            !hasLintStagedConfigFile &&
            findUp('.git', { directories: true, files: false })
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
              pkg['lint-staged'] = packageJsonLintStageDefault
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

        if (pkg['lint-staged']) {
          if (JSON.stringify(pkg['lint-staged']) === JSON.stringify(packageJsonLintStageDefault)) {
            delete pkg['lint-staged']
            if (!hasLintStagedConfigFile) {
              shouldCreateLintStagedConfigFile = true
            }
          } else {
            emitWarning(
              chalk.yellow(
                `Is adviced to not use lint-staged in package.json but instead provide a configuration file named ${chalk.yellowBright(
                  '.lintstagedrc.js'
                )}. The recommended config is: \n${chalk.white(lintStagedCode())}`
              )
            )
          }
        }

        if (
          !hasLintStagedConfigFile &&
          !shouldCreateLintStagedConfigFile &&
          pkg.husky &&
          typeof pkg.husky.hooks === 'object' &&
          pkg.husky.hooks !== null &&
          !pkg['lint-staged']
        ) {
          for (const v of Object.values(pkg.husky.hooks)) {
            if (typeof v === 'string' && v.includes('lint-staged')) {
              shouldCreateLintStagedConfigFile = true
              break
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

    if (shouldCreateLintStagedConfigFile) {
      await updateTextFileAsync({
        filePath: resolveProjectFile('.lintstagedrc.js'),
        format: 'text',
        async content() {
          return lintStagedCode()
        }
      })
    }

    return resultManifest
  }
}

function lintStagedCode() {
  return `
const { acurisEslintPatterns, acurisEslintPath } = require('acuris-eslint/lint-staged')

/** lint-staged configuration */
module.exports = {
  [acurisEslintPatterns]: \`node \${acurisEslintPath} --lint-staged --fix --max-warnings=0\`
}
`
}
