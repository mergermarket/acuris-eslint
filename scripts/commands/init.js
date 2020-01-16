'use strict'

const { fileExists, resolveProjectFile } = require('../lib/fs-utils')
const prettierInterface = require('eslint-plugin-quick-prettier/prettier-interface')
const { emitSection, emitInitComplete } = require('../lib/notes')
const { updateTextFileAsync } = require('../lib/text-utils')
const IgnoreFile = require('../lib/IgnoreFile')

module.exports = async cliOptions => {
  require('../acuris-eslint-help').printLogo('init')

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
  }

  emitInitComplete()
}
