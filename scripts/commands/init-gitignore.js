'use strict'

const { resolveAcurisEslintFile, resolveProjectFile } = require('../lib/fs-utils')
const { readTextFile, updateTextFileAsync } = require('../lib/text-utils')
const IgnoreFile = require('../lib/IgnoreFile')

module.exports = async () => {
  await updateTextFileAsync({
    filePath: resolveProjectFile('.gitignore'),
    async content(previousContent) {
      const targetGitIgnore = new IgnoreFile(previousContent)
      targetGitIgnore.merge(new IgnoreFile(readTextFile(resolveAcurisEslintFile('.gitignore.default'))))
      if (!targetGitIgnore.changed) {
        return undefined
      }
      return targetGitIgnore.toString()
    }
  })
}
