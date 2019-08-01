'use strict'

const { prettierInterface } = require('../../core/node-modules')
const { emitSection, emitInitComplete } = require('../lib/notes')

module.exports = async options => {
  let prettierInitialised = false
  if (options.initPrettier !== false) {
    try {
      if (prettierInterface.tryGetPrettier()) {
        emitSection('init-prettier')
        await require('./init-prettier')(options)
        prettierInitialised = true
      }
    } catch (_error) {}
  }

  if (options.initPackage !== false) {
    emitSection('init-package')
    await require('./init-package')(options)
  }

  if (!prettierInitialised && options.initPrettier !== false) {
    emitSection('init-prettier')
    await require('./init-prettier')(options)
  }

  if (options.initEslint !== false) {
    emitSection('init-eslint')
    await require('./init-eslint')(options)
  }

  if (options.initVscode !== false) {
    emitSection('init-vscode')
    await require('./init-vscode')(options)
  }

  if (options.initGitignore !== false) {
    emitSection('init-gitignore')
    await require('./init-gitignore')(options)
  }

  emitInitComplete()
}
