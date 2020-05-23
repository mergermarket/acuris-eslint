'use strict'

const prettierInterface = require('eslint-plugin-quick-prettier/prettier-interface')
const { emitSection, emitInitComplete } = require('../lib/notes')

module.exports = async (cliOptions) => {
  require('../acuris-eslint-help').printLogo('init')

  emitSection('init git')
  await require('./init-git')(cliOptions)

  let prettierInitialised = false
  try {
    if (prettierInterface.tryGetPrettier()) {
      emitSection('init-prettier')
      await require('./init-prettier')(cliOptions)
      prettierInitialised = true
    }
  } catch (_error) {}

  emitSection('init-package')
  await require('./init-package')(cliOptions)

  if (!prettierInitialised) {
    emitSection('init-prettier')
    await require('./init-prettier')(cliOptions)
  }

  emitSection('init-eslint')
  await require('./init-eslint')(cliOptions)

  emitSection('init-vscode')
  await require('./init-vscode')(cliOptions)

  emitInitComplete()
}
