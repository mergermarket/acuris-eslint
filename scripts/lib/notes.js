const chalk = require('chalk').default

const _defaultNotes = {
  gitFolderNotFound: false,
  shouldRestartVsCode: false,
  shouldRestartIde: false,
  shouldInstallVsCodePlugins: false,
  packageJsonIsNotPrivateWarning: false,
  eslintConfigUpdated: null,
  hasIdea: false,
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

function emitSubCommand(name) {
  console.log(`\n${chalk.blueBright(name)}\n`)
}

exports.emitSubCommand = emitSubCommand

function emitInitComplete() {
  console.log(chalk.greenBright('\n> Initialization completed <'))
}

exports.emitInitComplete = emitInitComplete

function flushNotes() {
  if (exports.notes.gitFolderNotFound) {
    emitWarning(chalk.yellow('.git folder not found. Did you run "git init"?'))
  }

  if (exports.notes.hasIdea) {
    emitWarning(
      chalk.yellow(
        `It seems you are using IntelliJ Idea ${chalk.gray(
          '(.idea folder found)'
        )}. Did you try Visual Studio Code? :-)\n  ${chalk.blue('https://code.visualstudio.com/')}`
      )
    )
  }

  if (exports.notes.eslintConfigUpdated) {
    emitNote(chalk.cyan(`eslint configuration has been updated. Manually check it to ensure it makes sense.`))
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

  if (exports.notes.packageJsonIsNotPrivateWarning) {
    emitWarning(
      chalk.yellow(
        `Package is not private but ${chalk.yellowBright(
          '.npmignore'
        )} file was not found. Please, add ${chalk.yellowBright(
          'private: true | false'
        )} in package.json to prevent accidental publication or create a ${chalk.yellowBright(
          '.npmignore'
        )} file.\n  ${chalk.blue('https://docs.npmjs.com/files/package.json#private')}`
      )
    )
  }

  if (exports.notes.needsNpmInstall) {
    emitImportant(
      chalk.yellowBright(`You need to install packages before continuing.\n`) +
        chalk.yellow(
          `  Run ${['npm install', 'yarn', 'lerna bootstrap']
            .map(x => chalk.greenBright(x))
            .join(' or ')} (depending on your project setup).`
        )
    )
  }

  exports.reset()
}

exports.flushNotes = flushNotes
