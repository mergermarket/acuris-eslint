const chalk = require('chalk').default

const _defaultNotes = {
  gitFolderNotFound: false,
  shouldRestartVsCode: false,
  shouldRestartIde: false,
  shouldInstallVsCodePlugins: false,
  eslintConfigUpdated: null,
  hasIdea: false
}

exports.notes = { ..._defaultNotes }

exports.reset = function reset() {
  Object.assign(exports.notes, _defaultNotes)
}

function emitWarning(...args) {
  console.warn(`\n${chalk.yellow('[WARNING]')}`, ...args)
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

function flushNotes() {
  if (exports.notes.gitFolderNotFound) {
    emitWarning('.git folder not found. Did you run "git init"?')
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

  exports.reset()
}

exports.flushNotes = flushNotes
