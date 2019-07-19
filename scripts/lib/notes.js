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

function warning(...args) {
  console.log(`\n${chalk.yellow('[WARNING]')}`, ...args)
}

exports.warning = warning

function note(...args) {
  console.log(`\n${chalk.blueBright('[NOTE]')}`, ...args)
}

exports.note = note

function flushNotes() {
  if (exports.notes.gitFolderNotFound) {
    warning('.git folder not found. Did you run "git init"?')
  }

  if (exports.notes.hasIdea) {
    warning(
      chalk.yellow(
        `It seems you are using IntelliJ Idea ${chalk.gray(
          '(.idea folder found)'
        )}. Did you try Visual Studio Code? :-)\n  ${chalk.blue('https://code.visualstudio.com/')}`
      )
    )
  }

  if (exports.notes.eslintConfigUpdated) {
    note(chalk.cyan(`eslint configuration has been updated. Manually check it to ensure it makes sense.`))
  }

  if (exports.notes.shouldRestartIde) {
    note(chalk.cyanBright('You should restart your IDE if was open.'))
  } else if (exports.notes.shouldRestartVsCode) {
    note(chalk.cyanBright('You should restart your Visual Studio Code if was open.'))
  }

  if (exports.notes.shouldInstallVsCodePlugins) {
    note(
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
