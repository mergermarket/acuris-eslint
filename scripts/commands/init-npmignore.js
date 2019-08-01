'use strict'

const { resolveAcurisEslintFile, resolveProjectFile } = require('../lib/fs-utils')
const { readTextFile, updateTextFileAsync } = require('../lib/text-utils')
const IgnoreFile = require('../lib/IgnoreFile')

module.exports = async options => {
  await updateTextFileAsync({
    filePath: resolveProjectFile('.npmignore'),
    askConfirmation: options && options.askConfirmation,
    async content(previousContent) {
      const target = new IgnoreFile(previousContent)
      target.merge(new IgnoreFile(readTextFile(resolveAcurisEslintFile('.npmignore.default'))))
      if (!target.changed) {
        return undefined
      }
      return target.toString()
    }
  })
}
