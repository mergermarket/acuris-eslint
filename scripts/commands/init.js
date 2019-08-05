'use strict'

const { fileExists, resolveProjectFile } = require('../lib/fs-utils')
const { prettierInterface } = require('../../core/node-modules')
const { emitSection, emitInitComplete, emitNote } = require('../lib/notes')

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

  if (options.initGitignore !== false && !fileExists(resolveProjectFile('.gitignore'))) {
    emitSection('init-gitignore')
    await require('./init-gitignore')(options)
  } else {
    emitNote('.gitignore already exists. You can run acuris-eslint --init-gitignore to update it.')
  }

  emitInitComplete()
}
