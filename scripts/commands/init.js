'use strict'

const { prettierInterface } = require('../../core/node-modules')
const { notes, emitSubCommand, emitInitComplete } = require('../lib/notes')

module.exports = async options => {
  let prettierInitialised = false
  try {
    if (prettierInterface.tryGetPrettier()) {
      emitSubCommand('init-prettier')
      await require('./init-prettier')(options)
      prettierInitialised = true
    }
  } catch (_error) {}

  emitSubCommand('init-package')
  await require('./init-package')(options)

  if (notes.needsNpmInstall) {
    return
  }

  if (!prettierInitialised) {
    emitSubCommand('init-prettier')
    await require('./init-prettier')(options)
  }

  emitSubCommand('init-eslint')
  await require('./init-eslint')(options)

  emitSubCommand('init-vscode')
  await require('./init-vscode')(options)

  emitSubCommand('init-gitignore')
  await require('./init-gitignore')(options)

  emitInitComplete()
}

module.exports.description = 'initialises or updates a project'
