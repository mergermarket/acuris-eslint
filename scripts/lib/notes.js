const chalk = require('chalk').default

let printedNotes = 0
const _defaultNotes = {
  shouldRestartVsCode: false,
  shouldRestartIde: false,
  shouldInstallVsCodePlugins: false,
  hasIdea: false
}

exports.notes = { ..._defaultNotes }

exports.reset = function reset() {
  Object.assign(exports.notes, _defaultNotes)
  printedNotes = 0
}

function printWarning(...args) {
  ++printedNotes
  console.log(`\n${chalk.yellow('[WARNING]')}}`, ...args)
}

function printNote(...args) {
  ++printedNotes
  console.log(`\n${chalk.blueBright('[NOTE]')}}`, ...args)
}

function flushNotes() {
  if (exports.notes.hasIdea) {
    printWarning(
      chalk.yellow(
        `It seems you are still using IntelliJ Idea. Did you try Visual Studio Code? :-)\n  ${chalk.blue(
          'https://code.visualstudio.com/'
        )}`
      )
    )
  }

  if (exports.notes.shouldRestartIde) {
    printNote(chalk.cyanBright('You should restart your IDE if was open.'))
  } else if (exports.notes.shouldRestartVsCode) {
    printNote(chalk.cyanBright('You should restart your Visual Studio Code if was open.'))
  }

  if (exports.notes.shouldInstallVsCodePlugins) {
    printNote(
      `${chalk.cyanBright(
        '.vscode/extensions.json was updated.\n  Visual Studio Code may be ask to install some recommended plugins.\n  If so, is recommended to install the recommended plugins.'
      )} \n  ${chalk.blue(
        'https://code.visualstudio.com/docs/editor/extension-gallery#_workspace-recommended-extensions\n'
      )}`
    )
  }

  if (printedNotes !== 0) {
    console.log()
  }

  exports.reset()
}

exports.flushNotes = flushNotes
