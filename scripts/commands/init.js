'use strict'

const { prettierInterface } = require('../../core/node-modules')
const { emitSection, emitInitComplete } = require('../lib/notes')

module.exports = async options => {
  let prettierInitialised = false
  try {
    if (prettierInterface.tryGetPrettier()) {
      emitSection('init-prettier')
      await require('./init-prettier')(options)
      prettierInitialised = true
    }
  } catch (_error) {}

  emitSection('init-package')
  await require('./init-package')(options)

  if (!prettierInitialised) {
    if (!prettierInterface.tryGetPrettier()) {
      if (!process.exitCode) {
        process.exitCode = 1
      }
      return
    }

    emitSection('init-prettier')
    await require('./init-prettier')(options)
  }

  emitSection('init-eslint')
  await require('./init-eslint')(options)

  emitSection('init-vscode')
  await require('./init-vscode')(options)

  emitSection('init-gitignore')
  await require('./init-gitignore')(options)

  emitInitComplete()
}
