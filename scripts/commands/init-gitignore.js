'use strict'

const { resolveAcurisEslintFile, resolveProjectFile } = require('../lib/fs-utils')
const { readTextFile, updateTextFileAsync } = require('../lib/text-utils')
const IgnoreFile = require('../lib/IgnoreFile')

module.exports = async () => {
  await updateTextFileAsync({
    filePath: resolveProjectFile('.gitignore'),
    async content(previousContent) {
      const target = new IgnoreFile(previousContent)
      target.merge(new IgnoreFile(readTextFile(resolveAcurisEslintFile('.gitignore.default'))))
      if (!target.changed) {
        return undefined
      }
      return target.toString()
    }
  })
}
