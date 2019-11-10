const chalk = require('chalk')
const path = require('path')
const { findUp, fileExists, directoryExists, resolveProjectFile } = require('./fs-utils')
const { readProjectPackageJson, getPackagesToInstall, getPackageJsonPath } = require('./package-utils')

const _defaultNotes = {
  shouldRestartVsCode: false,
  shouldRestartIde: false,
  shouldInstallVsCodePlugins: false,
  eslintConfigUpdated: null,
  needsNpmInstall: false
}

exports.notes = { ..._defaultNotes }

exports.reset = function reset() {
  Object.assign(exports.notes, _defaultNotes)
}

function emitWarning(...args) {
  console.warn(`\n${chalk.yellowBright('[WARNING]')}`, ...args)
}

exports.emitWarning = emitWarning

function emitError(...args) {
  console.error(`\n${chalk.redBright('[ERROR]')}`, ...args)
}

exports.emitError = emitError

function emitNote(...args) {
  console.log(`\n${chalk.blueBright('[NOTE]')}`, ...args)
}

exports.emitNote = emitNote

function emitImportant(...args) {
  console.log(`\n${chalk.redBright('[IMPORTANT]')}`, ...args)
}

exports.emitImportant = emitImportant

function emitSection(name) {
  console.log(`\n${chalk.blueBright(name)}\n`)
}

exports.emitSection = emitSection

function emitInitComplete() {
  if (!process.exitCode) {
    console.log(chalk.greenBright('\n> Initialization completed <'))
  }
}

exports.emitInitComplete = emitInitComplete

function flushNotes() {
  if (!findUp('.git', { directories: true, files: false })) {
    emitWarning(chalk.yellow(`.git folder not found. Did you run "${chalk.yellowBright('git init')}"?`))
  }

  if (exports.notes.shouldRestartIde) {
    emitNote(chalk.cyanBright('You should restart your IDE if was open.'))
  } else if (exports.notes.shouldRestartVsCode) {
    emitNote(chalk.cyanBright('You should restart your Visual Studio Code if was open.'))
  }

  if (exports.notes.shouldInstallVsCodePlugins) {
    emitNote(
      `${chalk.cyanBright(
        '.vscode/extensions.json was updated.\n  Visual Studio Code may be ask to install some recommended plugins.\n  If so, is recommended to install the recommended plugins.'
      )} \n  ${chalk.blue(
        'https://code.visualstudio.com/docs/editor/extension-gallery#_workspace-recommended-extensions\n'
      )}`
    )
  }

  validatePackage()

  if (directoryExists(resolveProjectFile('.idea'))) {
    emitNote(
      chalk.yellow(
        `It seems you are using IntelliJ Idea ${chalk.gray(
          '(.idea folder found)'
        )} - did you try Visual Studio Code? :-)\n  ${chalk.blue('https://code.visualstudio.com/')}`
      )
    )
  }

  if (process.exitCode) {
    emitImportant(
      chalk.yellowBright(
        `You should run ${`${chalk.cyanBright(path.basename(process.argv[1], '.js'))} ${chalk.cyanBright(
          process.argv.slice(2).join(' ')
        )}`} again.`
      )
    )
  }
  exports.reset()
}

function validatePackage() {
  const packageJsonPath = getPackageJsonPath()

  const manifest = readProjectPackageJson(packageJsonPath)
  if (!manifest) {
    emitWarning(chalk.yellow('package.json not found'))
  } else {
    if (
      !manifest.private &&
      !Array.isArray(manifest.files) &&
      !fileExists(path.resolve(path.dirname(packageJsonPath), '.npmignore'))
    ) {
      emitWarning(
        `${chalk.yellow('File')} ${chalk.yellowBright('.npmignore')} ${chalk.yellow(
          `not found, field ${chalk.yellowBright('files')} not found in ${chalk.yellowBright(
            'package.json'
          )} and field ${chalk.yellowBright('private')} is ${chalk.redBright(
            `${manifest.private}`
          )}.\n  This may cause unwanted files to be published on npm.`
        )}\n  ${chalk.blue('https://docs.npmjs.com/misc/developers#keeping-files-out-of-your-package')}`
      )
    }

    const packagesToInstall = getPackagesToInstall()
    if (packagesToInstall.length > 0) {
      console.log(chalk.cyan('\n  Packages are missing...'), chalk.gray(packagesToInstall.join(' ')))
      emitImportant(
        chalk.yellowBright(`You need to install packages before continuing.\n`) +
          chalk.yellow(
            `  Run ${['npm install', 'yarn', 'lerna bootstrap']
              .map(x => chalk.greenBright(x))
              .join(' or ')} (depending on your project setup).`
          )
      )
    }
  }

  if (
    fileExists(path.join(path.dirname(packageJsonPath), 'yarn.lock')) &&
    fileExists(path.join(path.dirname(packageJsonPath), 'package-lock.json'))
  ) {
    emitWarning(
      chalk.yellow(
        `Both ${chalk.yellowBright('package-lock.json')} and ${chalk.yellowBright(
          'yarn.lock'
        )} exists. You should use one package manager.\n  Delete ${chalk.yellowBright(
          'yarn.lock'
        )} if you want to use npm.\n  Delete ${chalk.yellowBright('package-lock.json')} if you want to use yarn.`
      )
    )
  }
}

exports.flushNotes = flushNotes
