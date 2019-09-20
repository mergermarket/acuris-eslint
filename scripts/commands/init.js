'use strict'

const { fileExists, resolveProjectFile } = require('../lib/fs-utils')
const { prettierInterface } = require('../../core/node-modules')
const { emitSection, emitInitComplete } = require('../lib/notes')
const { updateTextFileAsync } = require('../lib/text-utils')
const IgnoreFile = require('../lib/IgnoreFile')

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
    emitSection('gitignore')
    if (fileExists(resolveProjectFile('.gitignore'))) {
      await updateTextFileAsync({
        filePath: resolveProjectFile('.gitignore'),
        async content(previousContent) {
          const target = new IgnoreFile(previousContent)
          target.merge(new IgnoreFile('.eslintcache'), false)
          if (!target.changed) {
            return undefined
          }
          return target.toString()
        }
      })
      console.log('      You can also run `acuris-eslint --init-gitignore` to update all defaults')
    } else {
      emitSection('init-gitignore')
      await require('./init-gitignore')(options)
    }
  }

  emitInitComplete()
}
